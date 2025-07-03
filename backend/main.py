import os
from dotenv import load_dotenv
import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pickle
from contextlib import asynccontextmanager
# Document processing libraries
import PyPDF2
import fitz  # PyMuPDF for better PDF text extraction
from pdf2image import convert_from_path
import docx2txt

# AI/ML libraries
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

# Web framework
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# File handling
import tempfile
import shutil
from io import BytesIO

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Added for semantic similarity
from sentence_transformers import SentenceTransformer
import numpy as np
from rapidfuzz import fuzz

@dataclass
class ViolationDetail:
    page_number: int
    section: str
    reference_document: str
    non_compliant_text: str
    explanation: str
    remedy_recommendation: str
    severity_level: str
    confidence: float
    result: str  # Compliant/Partial/Violation

@dataclass
class ComplianceResult:
    document_name: str
    result: str  # Compliant/Partial/Violation
    explanation: str
    violations: List[ViolationDetail]
    confidence_score: float
    input_token_count: int = 0
    output_token_count: int = 0
    total_token_count: int = 0

@dataclass
class ComplianceReport:
    input_document: str
    compliance_score: float
    total_checks: int
    issue_counts: Dict[str, int]
    detailed_results: List[ComplianceResult]
    non_compliance_table: List[Dict[str, Any]]
    generated_at: str

class DocumentProcessor:
    """Handle document processing and text extraction for PDF, DOCX, and TXT"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Dict[int, str]:
        """Extract text from PDF with page-wise organization"""
        try:
            # Try PyMuPDF first (better text extraction)
            doc = fitz.open(file_path)
            pages_text = {}
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                pages_text[page_num + 1] = text
            
            doc.close()
            return pages_text
            
        except Exception as e:
            logger.warning(f"PyMuPDF failed, trying PyPDF2: {e}")
            
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    pages_text = {}
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        text = page.extract_text()
                        pages_text[page_num + 1] = text
                    
                    return pages_text
                    
            except Exception as e2:
                logger.error(f"Both PDF extraction methods failed: {e2}")
                return {}
    
    @staticmethod
    def extract_text_from_docx(file_path: str) -> Dict[int, str]:
        """Extract text from DOCX file (all as one page)"""
        try:
            text = docx2txt.process(file_path)
            return {1: text}
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return {}

    @staticmethod
    def extract_text_from_txt(file_path: str) -> Dict[int, str]:
        """Extract text from TXT file (all as one page)"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
            return {1: text}
        except Exception as e:
            logger.error(f"TXT extraction failed: {e}")
            return {}
    
    @staticmethod
    def extract_sections(text: str) -> Dict[str, str]:
        """Extract sections from document text"""
        sections = {}
        
        # Common section patterns
        section_patterns = [
            r'\n\s*(\d+\.[\d\.]*\s+[A-Z][^:\n]+)[:.]?\s*\n',
            r'\n\s*([A-Z][A-Z\s]{5,})\s*\n',    # ALL CAPS HEADERS
            r'\n\s*(SECTION\s+\d+[^:\n]+)[:.]?\s*\n', # SECTION 1: ...
            r'\n\s*(ARTICLE\s+\d+[^:\n]+)[:.]?\s*\n', # ARTICLE 1: ...
            r'\n\s*(APPENDIX\s+\d+[^:\n]+)[:.]?\s*\n' # APPENDIX 1: ...
        ]
        
        current_section = "General"
        current_text = ""
        
        lines = text.split('\n')
        
        for line in lines:
            is_section_header = False
            
            for pattern in section_patterns:
                match = re.search(pattern, f"\n{line}\n")
                if match:
                    # Save previous section
                    if current_text.strip():
                        sections[current_section] = current_text.strip()
                    
                    # Start new section
                    current_section = match.group(1).strip()
                    current_text = ""
                    is_section_header = True
                    break
            
            if not is_section_header:
                current_text += line + "\n"
        
        # Save last section
        if current_text.strip():
            sections[current_section] = current_text.strip()
        
        return sections if sections else {"General": text}

class AIComplianceChecker:
    """AI-powered compliance checking using Gemini"""
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        self.generation_config = GenerationConfig(
            temperature=0.1,
            top_p=0.8,
            top_k=40,
        )
    
    def _extract_response_text(self, response) -> str:
        """Extract text from Gemini response, handling multiple parts properly"""
        try:
            # Check if response has candidates and content
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        # Get the first valid text part
                        for part in candidate.content.parts:
                            if hasattr(part, 'text') and part.text.strip():
                                return part.text.strip()
            
            # Fallback to response.text if available
            if hasattr(response, 'text') and response.text and response.text.strip():
                return response.text.strip()
            
            raise ValueError("No valid text content found in response")
            
        except Exception as e:
            logger.error(f"Error extracting response text: {e}")
            raise ValueError(f"Failed to extract response text: {str(e)}")
    
    def _process_ai_response(self, response: str) -> Dict:
        """Process AI response and extract JSON"""
        try:
            # Extract text from response properly
            response_text = self._extract_response_text(response)
            if not response_text:
                raise ValueError("Empty response text")
            
            logger.info(f"Extracted response text length: {len(response_text)}")
            logger.debug(f"Response text preview: {response_text[:500]}...")
            
            # Clean and process the response text
            cleaned_text = self._clean_response_text(response_text)

            # Try to parse JSON directly
            try:
                return json.loads(cleaned_text)
            except json.JSONDecodeError as e:
                logger.error(f"Direct JSON parsing failed: {e}")
                logger.error(f"Problematic JSON: {cleaned_text[:500]}...")
                # Try cleaning and parsing again
                try:
                    cleaned = self._clean_json_string(cleaned_text)
                    logger.error(f"Cleaned JSON: {cleaned[:500]}...")
                    return json.loads(cleaned)
                except json.JSONDecodeError as e2:
                    logger.error(f"JSON parsing after cleaning failed: {e2}")
                    return self._parse_text_response(response_text)
                
        except Exception as e:
            logger.error(f"Response processing failed: {e}")
            return self._parse_text_response(str(e))
    
    def _clean_response_text(self, response_text: str) -> str:
        """Clean response text to extract JSON content"""        
        # Remove markdown code blocks
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
            
        if response_text.endswith('```'):
            response_text = response_text[:-3]
            
        response_text = response_text.strip()
        return response_text

    async def check_compliance(self, input_text: str, compliance_text: str, 
                        compliance_doc_name: str, playbook_section: str = None) -> ComplianceResult:
        """Check compliance of input document against a compliance document, with optional playbook guidance."""
        logger.info(f"AI check started for {compliance_doc_name} at {datetime.now().isoformat()}")
        playbook_prompt = f"\n\nPLAYBOOK GUIDANCE (for validation reference):\n{playbook_section}\n" if playbook_section else ""
        prompt = f"""
        You are an expert regulatory compliance analyst. Your main task is to compare the INPUT DOCUMENT against the COMPLIANCE DOCUMENT and provide a detailed analysis.

        COMPLIANCE DOCUMENT ({compliance_doc_name}):
        {compliance_text}
        {playbook_prompt}
        INPUT DOCUMENT:
        {input_text}

        ANALYSIS REQUIREMENTS:
        1. Identify ALL compliance violations, partial compliance, and compliant sections
        2. For each issue found, provide:
           - Specific page number
           - Section reference on that page number (ONE section/rule per violation entry)
           - Exact non-compliant text excerpt. 
           - Clear explanation of the violation  (use PLAYBOOK GUIDANCE to explain the intent if helpful)
           - Specific remedy recommendation  (use PLAYBOOK GUIDANCE for best practices or fallback steps)
           - Severity level (High/Medium/Low)
           - Confidence percentage (0-100)

        IMPORTANT: Each violation in the JSON array must correspond to only ONE section or rule. 
        Do NOT group or combine multiple sections/rules in a single violation entry. 
        If multiple sections/rules are violated, create a separate violation entry for each.

        SEVERITY CLASSIFICATION:
        - High: Complete violation of critical regulatory requirements that could result in severe penalties
        - Medium: Partial compliance or missing important requirements
        - Low: Best practice issues or minor procedural gaps

        Analyze thoroughly and provide detailed, actionable insights.
        RESPONSE FORMAT (MUST BE VALID JSON):
        {{
            "overall_result": "Compliant|Partial|Violation",
            "overall_explanation": "Brief summary of compliance status",
            "confidence_score": 85.5,
            "violations": [
                {{
                    "page_number": 1,
                    "section": "Section name or description",
                    "non_compliant_text": "Exact text from input document",
                    "explanation": "Why this violates the compliance requirement",
                    "remedy_recommendation": "Specific steps to fix this issue",
                    "severity_level": "High|Medium|Low",
                    "confidence": 90.5,
                    "result": "Violation|Partial|Compliant"
                }}
            ]
        }}
        CRITICAL INSTRUCTIONS: 
        - Return ONLY valid JSON. 
        - Do not include any text before or after the JSON. 
        - Do not repeat the JSON response
        - Escape all quotes and special characters properly.
        """
        
        try:
            #This async client uses HTTP instead of gRPC. It might show slight slowdowns or occasional bugs
            response = await self.model.generate_content_async(
                prompt,
                generation_config=self.generation_config
            )
            
            # Debug: Log response structure
            if hasattr(response, 'candidates') and response.candidates:
                logger.debug(f"Number of candidates: {len(response.candidates)}")
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        logger.debug(f"Number of parts in response: {len(candidate.content.parts)}")
                        for i, part in enumerate(candidate.content.parts):
                            if hasattr(part, 'text'):
                                logger.debug(f"Part {i} text length: {len(part.text) if part.text else 0}")
                                
            # Extract token usage information
            input_tokens = 0
            output_tokens = 0
            total_tokens = 0
            
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                input_tokens = getattr(response.usage_metadata, 'prompt_token_count', 0)
                output_tokens = getattr(response.usage_metadata, 'candidates_token_count', 0)
                total_tokens = getattr(response.usage_metadata, 'total_token_count', 0)
                
                # Print token usage information
                logger.info(f"Token Usage for {compliance_doc_name}: Input={input_tokens}, Output={output_tokens}, Total={total_tokens}")
            
            analysis = self._process_ai_response(response)
            
            # Deduplicate violations
            if 'violations' in analysis:
                # Filter out violations with non_compliant_text == 'N/A' (case-insensitive, strip spaces)
                analysis['violations'] = [
                    v for v in analysis['violations']
                    if v.get('non_compliant_text', '').strip().upper() != 'N/A'
                ]
                analysis['violations'] = self._deduplicate_violations(analysis['violations'])

            # Convert to ComplianceResult
            violations = []
            for v in analysis.get('violations', []):
                violation = ViolationDetail(
                    page_number=v.get('page_number', 1),
                    section=v.get('section', 'Unknown'),
                    reference_document=compliance_doc_name,
                    non_compliant_text=v.get('non_compliant_text', ''),
                    explanation=v.get('explanation', ''),
                    remedy_recommendation=v.get('remedy_recommendation', ''),
                    severity_level=v.get('severity_level', 'Low'),
                    confidence=v.get('confidence', 0.0),
                    result=v.get('result', 'Violation')
                )
                violations.append(violation)
            
            logger.info(f"AI check finished for {compliance_doc_name} at {datetime.now().isoformat()}")
            
            return ComplianceResult(
                document_name=compliance_doc_name,
                result=analysis.get('overall_result', 'Violation'),
                explanation=analysis.get('overall_explanation', ''),
                violations=violations,
                confidence_score=analysis.get('confidence_score', 0.0),
                input_token_count=input_tokens,
                output_token_count=output_tokens,
                total_token_count=total_tokens
            )
            
        except Exception as e:
            logger.error(f"AI analysis failed for {compliance_doc_name}: {e}")
            logger.info(f"AI check finished for {compliance_doc_name} at {datetime.now().isoformat()}")
            return ComplianceResult(
                document_name=compliance_doc_name,
                result="Error",
                explanation=f"Analysis failed: {str(e)}",
                violations=[],
                confidence_score=0.0,
                input_token_count=0,
                output_token_count=0,
                total_token_count=0
            )
    
    def _clean_json_string(self, json_str: str) -> str:
        """Clean JSON string to fix common issues, including trailing commas, unescaped newlines, and incomplete JSON."""
        # Remove BOM and invisible characters
        json_str = json_str.encode('utf-8').decode('utf-8-sig').strip()
        
        # Remove markdown code block if present
        if json_str.startswith('```json'):
            json_str = json_str[7:]
        if json_str.endswith('```'):
            json_str = json_str[:-3]
        json_str = json_str.strip()
        
        # Remove any text before the first {
        start_idx = json_str.find('{')
        if start_idx > 0:
            json_str = json_str[start_idx:]
        # Remove any text after the last }
        end_idx = json_str.rfind('}')
        if end_idx >= 0:
            json_str = json_str[:end_idx + 1]
        # Remove trailing commas before } or ]
        json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
        
        # Escape unescaped newlines inside string values (replace actual newlines with \n)
        def escape_newlines_in_strings(match):
            content = match.group(0)
            return content.replace('\n', '\\n').replace('\r', '\\r')
        # Only apply to string values
        json_str = re.sub(r'"([^"]*)"', escape_newlines_in_strings, json_str)
        
        # Remove any duplicate consecutive opening/closing braces
        json_str = re.sub(r'\{\s*\{', '{', json_str)
        json_str = re.sub(r'\}\s*\}', '}', json_str)
        
        return json_str
    
    def _deduplicate_violations(self, violations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Deduplicate violations based on explanation similarity."""
        if not violations:
            return []

        unique_violations = []
        
        for i in range(len(violations)):
            is_duplicate = False
            for j in range(len(unique_violations)):
                # Using a simple substring check for similarity.
                # If one explanation is a substring of another, they are likely related.
                if (violations[i]['explanation'] in unique_violations[j]['explanation'] or 
                    unique_violations[j]['explanation'] in violations[i]['explanation']):
                    
                    # Keep the one with the longer explanation, assuming it's more detailed.
                    if len(violations[i]['explanation']) > len(unique_violations[j]['explanation']):
                        unique_violations[j] = violations[i] # Replace with the more detailed one
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_violations.append(violations[i])
        
        # Another pass to remove exact duplicates that might have been introduced
        final_violations = []
        seen_explanations = set()
        for v in unique_violations:
            if v['explanation'] not in seen_explanations:
                final_violations.append(v)
                seen_explanations.add(v['explanation'])

        if len(final_violations) < len(violations):
            logger.info(f"Deduplicated {len(violations) - len(final_violations)} violations.")
        return final_violations

    def _parse_text_response(self, text: str) -> Dict:
        """Fallback text parsing if JSON extraction fails"""
        
        logger.warning("JSON extraction failed. Fallback text parsing used")
        result = {
            "overall_result": "Violation",
            "overall_explanation": "Failed to parse AI response properly",
            "confidence_score": 50.0,
            "violations": []
        }
        
        # Look for overall result
        text_lower = text.lower()
        # Look for overall result
        if "compliant" in text_lower:
            if "non-compliant" in text_lower or "violation" in text_lower:
                result["overall_result"] = "Partial"
            else:
                result["overall_result"] = "Compliant"
        
        # Try to extract at least one violation if mentioned
        if "violation" in text_lower or "non-compliant" in text_lower:
            violation = {
                "page_number": 1,
                "section": "General",
                "non_compliant_text": "Could not extract specific text",
                "explanation": "AI response could not be parsed properly",
                "remedy_recommendation": "Review document manually",
                "severity_level": "Medium",
                "confidence": 30.0,
                "result": "Violation"
            }
            result["violations"].append(violation)
        
        return result

class ComplianceDocumentManager:
    """Manage compliance documents storage and retrieval with in-memory caching."""
    
    def __init__(self, cache_path="compliance_text_cache"):
        self.cache_path = Path(cache_path)
        self.cache_path.mkdir(exist_ok=True)
        self.available_docs = [f.name.replace('.txt', '.pdf') for f in self.cache_path.glob("*.txt")]

    def get_available_documents(self) -> List[str]:
        return self.available_docs

    def get_document_content(self, doc_name: str) -> str:
        cache_file = self.cache_path / (Path(doc_name).stem + ".txt")
        if not cache_file.exists():
            raise FileNotFoundError(f"Cached text for '{doc_name}' not found in {self.cache_path}. Please run the extraction script.")
        with open(cache_file, "r", encoding="utf-8") as f:
            return f.read()

    def select_documents_by_query(self, query: str) -> List[str]:
        """Select compliance documents based on user query by matching file names or keywords"""
        query_lower = query.lower()
        available_docs = self.get_available_documents()
        
        if not available_docs:
            logger.warning("Compliance Documents are not available")
            return []
        
        # Pattern 1: Check for "all documents" patterns
        all_patterns = [
            r'\ball\s+documents?\b',
            r'\ball\s+compliance\s+documents?\b',
            r'\bevery\s+documents?\b',
            r'\bcomplete\s+compliance\b',
            r'\bcomprehensive\s+check\b',
            r'\bfull\s+compliance\b',
            r'\bentire\s+set\b'
        ]
        
        for pattern in all_patterns:
            if re.search(pattern, query_lower):
                return available_docs
            
        # Pattern 2: Generic compliance check (defaults to all documents)
        generic_patterns = [
            r'^do\s+compliance\s+check',
            r'^perform\s+compliance\s+check',
            r'^check\s+compliance',
            r'^compliance\s+check',
            r'^analyze\s+compliance',
            r'^verify\s+compliance'
        ]
        for pattern in generic_patterns:
            if re.search(pattern, query_lower):
                # Check if specific documents are mentioned later in the query
                specific_docs = self._extract_specific_documents(query_lower, available_docs)
                if specific_docs:
                    return specific_docs
                return available_docs
        
        # Pattern 3: Extract specific document names from query
        specific_docs = self._extract_specific_documents(query_lower, available_docs)
        if specific_docs:
            return specific_docs
        
        # Pattern 4: Keyword-based matching for document content/type
        keyword_matches = self._match_by_keywords(query_lower, available_docs)
        if keyword_matches:
            return keyword_matches
        
        # Pattern 5: Fuzzy matching for document names
        fuzzy_matches = self._fuzzy_match_documents(query_lower, available_docs)
        if fuzzy_matches:
            return fuzzy_matches
            
        # Default: If no specific patterns match, return all documents
        # This ensures the system doesn't fail when users ask for compliance checks
        return available_docs

    def _extract_specific_documents(self, query: str, available_docs: List[str]) -> List[str]:
        """Extract specific document names mentioned in the query"""
        selected_docs = []
        
        # Look for .pdf files mentioned in the query
        pdf_pattern = r'\b(\w+(?:[_-]\w+)*\.pdf)\b'
        pdf_matches = re.findall(pdf_pattern, query, re.IGNORECASE)
        
        for match in pdf_matches:
            # Find exact matches first
            exact_match = next((doc for doc in available_docs if doc.lower() == match.lower()), None)
            if exact_match and exact_match not in selected_docs:
                selected_docs.append(exact_match)
        
        # Look for document names without .pdf extension
        for doc in available_docs:
            doc_base = doc.replace('.pdf', '').lower()
            doc_variations = [
                doc_base,
                doc_base.replace('_', ' '),
                doc_base.replace('-', ' '),
                doc_base.replace('_', ''),
                doc_base.replace('-', '')
            ]
            
            for variation in doc_variations:
                if variation in query and doc not in selected_docs:
                    selected_docs.append(doc)
                    break
        
        return selected_docs
    
    def _match_by_keywords(self, query: str, available_docs: List[str]) -> List[str]:
        """Match documents based on keywords in their names"""
        keyword_matches = []
        
        # Extract potential keywords from query
        query_words = set(re.findall(r'\b\w{3,}\b', query))
        
        for doc in available_docs:
            doc_words = set(re.findall(r'\b\w{3,}\b', doc.lower().replace('.pdf', '')))
            
            # Check for word overlap
            common_words = query_words.intersection(doc_words)
            if common_words and doc not in keyword_matches:
                keyword_matches.append(doc)
        
        return keyword_matches
    
    def _fuzzy_match_documents(self, query: str, available_docs: List[str]) -> List[str]:
        """Perform fuzzy matching for document names"""
        fuzzy_matches = []
        
        for doc in available_docs:
            doc_base = doc.replace('.pdf', '').lower()
            
            # Split both query and document name into words
            query_words = set(query.split())
            doc_words = set(doc_base.replace('_', ' ').replace('-', ' ').split())
            
            # Calculate similarity based on word overlap
            if doc_words and query_words:
                overlap = len(query_words.intersection(doc_words))
                similarity = overlap / len(doc_words)
                
                # If similarity is high enough, include the document
                if similarity >= 0.3:  # 30% similarity threshold
                    fuzzy_matches.append(doc)
        
        return fuzzy_matches

class ComplianceChecker:
    """Main compliance checker orchestrator"""
    
    TOP_N_RELEVANT_PAGES = 5
    EMBEDDING_CACHE_DIR = 'compliance_embeddings'
    PLAYBOOK_DOC_NAME = 'MAS Regulatory Compliance Playbook.pdf'
    PLAYBOOK_SECTION_COUNT = 10  # Number of top playbook sections to retrieve
    PLAYBOOK_CACHE_FILE = 'playbook_embeddings/playbook_sections_and_embeddings.pkl'

    def __init__(self, gemini_api_key: str):
        self.document_manager = ComplianceDocumentManager()
        self.ai_checker = AIComplianceChecker(gemini_api_key)
        self.document_processor = DocumentProcessor()
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        os.makedirs(self.EMBEDDING_CACHE_DIR, exist_ok=True)
        # Load playbook sections and embeddings from cache if available
        self.playbook_sections, self.playbook_section_embeddings = self._load_playbook_sections_and_embeddings()

    def _load_playbook_sections_and_embeddings(self):
        """Load playbook sections and embeddings from cache, or recompute if missing."""
        import pickle
        cache_file = self.PLAYBOOK_CACHE_FILE
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                data = pickle.load(f)
            return data.get('sections', []), data.get('embeddings', None)
        # Fallback: recompute (should not happen in normal use)
        playbook_path = os.path.join('playbook_text_cache', self.PLAYBOOK_DOC_NAME.replace('.pdf', '.txt'))
        if not os.path.exists(playbook_path):
            return [], None
        with open(playbook_path, 'r', encoding='utf-8') as f:
            playbook_text = f.read()
        sections = DocumentProcessor.extract_sections(playbook_text)
        section_texts = list(sections.values())
        if not section_texts:
            return [], None
        section_embeddings = self.embedding_model.encode(section_texts, convert_to_numpy=True)
        return section_texts, section_embeddings

    def _retrieve_relevant_playbook_sections(self, compliance_text, top_n=None):
        """Retrieve the most relevant playbook sections for a given compliance document text."""
        if not self.playbook_sections or self.playbook_section_embeddings is None:
            return ""
        top_n = top_n or self.PLAYBOOK_SECTION_COUNT
        compliance_embedding = self.embedding_model.encode([compliance_text], convert_to_numpy=True)[0]
        similarities = np.dot(self.playbook_section_embeddings, compliance_embedding) / (
            np.linalg.norm(self.playbook_section_embeddings, axis=1) * np.linalg.norm(compliance_embedding) + 1e-8
        )
        top_indices = np.argsort(similarities)[::-1][:top_n]
        relevant_sections = [self.playbook_sections[i] for i in top_indices]
        return '\n\n'.join(relevant_sections)

    def _embedding_similarity(self, page_texts, compliance_embedding):
        texts = list(page_texts.values())
        page_embeddings = self.embedding_model.encode(texts, convert_to_numpy=True)
        similarities = np.dot(page_embeddings, compliance_embedding) / (
            np.linalg.norm(page_embeddings, axis=1) * np.linalg.norm(compliance_embedding) + 1e-8
        )
        return similarities

    def _get_compliance_embedding_path(self, doc_name):
        safe_name = doc_name.replace('/', '_').replace(' ', '_')
        return os.path.join(self.EMBEDDING_CACHE_DIR, f"{safe_name}.pkl")

    def precompute_compliance_embeddings(self):
        """
        Precompute and cache embeddings for all compliance documents.
        Run this function locally when compliance documents are updated.
        """
        docs = self.document_manager.get_available_documents()
        for doc_name in docs:
            embedding_path = self._get_compliance_embedding_path(doc_name)
            if os.path.exists(embedding_path):
                print(f"Embedding already exists for {doc_name}, skipping.")
                continue
            print(f"Computing embedding for {doc_name}...")
            compliance_text = self.document_manager.get_document_content(doc_name)
            embedding = self.embedding_model.encode([compliance_text], convert_to_numpy=True)[0]
            with open(embedding_path, 'wb') as f:
                pickle.dump(embedding, f)
            print(f"Saved embedding for {doc_name} to {embedding_path}")

    def _load_compliance_embedding(self, doc_name):
        embedding_path = self._get_compliance_embedding_path(doc_name)
        if not os.path.exists(embedding_path):
            raise FileNotFoundError(f"Embedding for {doc_name} not found. Please run precompute_compliance_embeddings().")
        with open(embedding_path, 'rb') as f:
            embedding = pickle.load(f)
        return embedding

    async def _process_single_compliance_doc(self, doc_name, input_pages):
        logger.info(f"Scoring semantic relevance of pages for {doc_name} using cached embeddings...")
        compliance_embedding = self._load_compliance_embedding(doc_name)
        non_empty_pages = {p: t for p, t in input_pages.items() if t.strip()}
        if not non_empty_pages:
            return None
        similarities = await asyncio.to_thread(self._embedding_similarity, non_empty_pages, compliance_embedding)
        sorted_indices = np.argsort(similarities)[::-1][:self.TOP_N_RELEVANT_PAGES]
        top_pages = [list(non_empty_pages.keys())[i] for i in sorted_indices]
        input_text = '\n\n'.join([non_empty_pages[p] for p in top_pages])
        if not input_text.strip():
            input_text = next(iter(input_pages.values()))
        compliance_text = self.document_manager.get_document_content(doc_name)
        # Retrieve relevant playbook sections
        playbook_section = self._retrieve_relevant_playbook_sections(compliance_text)
        return await self.ai_checker.check_compliance(input_text, compliance_text, doc_name, playbook_section)

    async def process_compliance_check(self, input_file_path: str, query: str) -> ComplianceReport:
  
        logger.info("Extracting text from input document...")
        def _extract_text():
            ext = os.path.splitext(input_file_path)[1].lower()
            if ext == '.pdf':
                return self.document_processor.extract_text_from_pdf(input_file_path)
            elif ext == '.docx':
                return self.document_processor.extract_text_from_docx(input_file_path)
            elif ext == '.txt':
                return self.document_processor.extract_text_from_txt(input_file_path)
            else:
                raise ValueError("Unsupported file type for input document")

        input_pages = await asyncio.to_thread(_extract_text)
        if not input_pages:
            raise ValueError("Could not extract text from input document")

        logger.info("Selecting compliance documents...")
        selected_docs = self.document_manager.select_documents_by_query(query)
        if not selected_docs:
            logger.warning("No documents selected by query, using all available documents")
            selected_docs = self.document_manager.get_available_documents()
        if not selected_docs:
            raise ValueError("No compliance documents available")
        logger.info(f"Selected {len(selected_docs)} compliance documents: {selected_docs}")

        # Parallelize per-compliance-document processing
        tasks = [
            self._process_single_compliance_doc(doc_name, input_pages)
            for doc_name in selected_docs
        ]
        #start_time = time.time()
        logger.info(f"Starting {len(tasks)} compliance checks in parallel...")
        results = await asyncio.gather(*tasks)
        # Remove any None results (if a doc had no non-empty pages)
        results = [r for r in results if r is not None]
        #end_time = time.time()
        #logger.info(f"All compliance checks completed in {end_time - start_time:.2f} seconds")
        logger.info("Generating compliance report...")
        report = self._generate_report(
            os.path.basename(input_file_path), 
            results
        )
        ''' 
        #For dev to check the report, uncomment the following lines
        with open("compliance_report.json", "w", encoding="utf-8") as f:
            json.dump(asdict(report), f, indent=2, ensure_ascii=False)
        '''    
        return report
    
    def _generate_report(self, input_doc_name: str, 
                        results: List[ComplianceResult]) -> ComplianceReport:
        """Generate comprehensive compliance report with error fallback"""
        try:
            # Calculate compliance score with severity-adjusted weighting
            total_checks = len(results)

            if total_checks == 0:
                logger.warning("No compliance checks performed")
                compliance_score = 80.0  # Minimum baseline score
            elif not results or all(not hasattr(r, 'result') or not r.result for r in results):
                logger.warning("All compliance results are empty or invalid")
                compliance_score = 80.0  # Minimum baseline score for incomplete analysis
            else:
                weighted_score = 0.0
                valid_results = 0
                
                for result in results:
                    # Skip invalid results but log them
                    if not hasattr(result, 'result') or not result.result:
                        logger.warning(f"Invalid result found for document: {getattr(result, 'document_name', 'unknown')}")
                        continue
                        
                    valid_results += 1
                                
                    doc_result = result.result.strip().lower()
                    if doc_result == "compliant":
                        doc_score = 100.0  # Full compliance
                    elif doc_result == "partial":
                        doc_score = 95.0  # Start with high baseline for partial compliance
                        if result.violations:
                            high_count = sum(1 for v in result.violations if str(v.severity_level).strip().lower() == "high")
                            medium_count = sum(1 for v in result.violations if str(v.severity_level).strip().lower() == "medium")
                            low_count = sum(1 for v in result.violations if str(v.severity_level).strip().lower() == "low")
                            
                            # Reduced penalty to maintain 80% minimum
                            severity_reduction = (high_count * 5) + (medium_count * 3) + (low_count * 1)
                            doc_score = max(80.0, doc_score - severity_reduction)  # Floor at 80%
                    elif doc_result == "violation":
                        doc_score = 90.0  # Start with reasonable baseline for violations
                        if result.violations:
                            high_count = sum(1 for v in result.violations if str(v.severity_level).strip().lower() == "high")
                            medium_count = sum(1 for v in result.violations if str(v.severity_level).strip().lower() == "medium")
                            low_count = sum(1 for v in result.violations if str(v.severity_level).strip().lower() == "low")
                            
                            # Calculate penalty based on violation severity
                            if high_count > 0:
                                # High severity violations: reduce by 2-10 points
                                severity_reduction = min(10, high_count * 2)
                                doc_score = max(80.0, doc_score - severity_reduction)
                            elif medium_count > 0:
                                # Medium severity violations: reduce by 1-5 points
                                severity_reduction = min(5, medium_count * 1)
                                doc_score = max(80.0, doc_score - severity_reduction)
                            else:
                                # Only low severity violations: minimal reduction
                                severity_reduction = min(3, low_count * 0.5)
                                doc_score = max(80.0, doc_score - severity_reduction)
                    else:
                        # Handle unknown/error states more gracefully
                        logger.warning(f"Unknown compliance result: {doc_result}")
                        doc_score = 80.0  # Minimum baseline for unknown states
                    
                    weighted_score += doc_score
                
                if valid_results == 0:
                    logger.error("No valid compliance results found")
                    compliance_score = 80.0  # Minimum baseline score
                else:
                    compliance_score = weighted_score / valid_results
                    # Ensure final score is never below 80%
                    compliance_score = max(80.0, compliance_score)
                
                compliance_score = round(compliance_score)
                # Summary logging
                compliant_count = sum(1 for r in results if r.result.strip().lower() == "compliant")
                partial_count = sum(1 for r in results if r.result.strip().lower() == "partial") 
                violation_count = sum(1 for r in results if r.result.strip().lower() == "violation")
                total_violations = sum(len(r.violations) for r in results)
                logger.info(f"⭐Document Results - Compliant: {compliant_count}, Partial: {partial_count}, Violations: {violation_count}")
                logger.info(f"⭐Total Individual Violations: {total_violations}")
                logger.info(f"⭐Final Compliance Score: {compliance_score:.2f}% (Minimum: 80%)")
            
            # Count issues by severity
            issue_counts = {"High": 0, "Medium": 0, "Low": 0}
            all_violations = []
            
            # Calculate total token usage
            total_input_tokens = sum(r.input_token_count for r in results)
            total_output_tokens = sum(r.output_token_count for r in results)
            total_tokens_used = total_input_tokens + total_output_tokens
            logger.info(f"📊 Total Token Usage Summary: Input={total_input_tokens}, Output={total_output_tokens}, Total={total_tokens_used}")
            
            # Filter and deduplicate violations for the final report
            filtered_all_violations = []
            text_threshold = 85
            severity_rank = {'high': 3, 'medium': 2, 'low': 1}
            grouped = {}
            for result in results:
                for violation in result.violations:
                    if violation.non_compliant_text.strip().upper() == 'N/A':
                        continue
                    # Filter out violations where page_number is not a single integer
                    if not isinstance(violation.page_number, int):
                        continue
                    # Also filter if page_number is a string containing a comma or not digit
                    if isinstance(violation.page_number, str):
                        if ',' in violation.page_number or not violation.page_number.strip().isdigit():
                            continue
                    # Filter out violations where page_number is -1
                    if violation.page_number == -1:
                        continue
                    page = violation.page_number
                    if page not in grouped:
                        grouped[page] = []
                    grouped[page].append(violation)
            # For each page, deduplicate by non_compliant_text only
            for page, violations in grouped.items():
                kept = []
                for v in violations:
                    found_similar = False
                    for i, existing in enumerate(kept):
                        nct_sim = fuzz.token_set_ratio(v.non_compliant_text.strip().lower(), existing.non_compliant_text.strip().lower())
                        if nct_sim >= text_threshold:
                            # Choose the better one (higher severity, then confidence)
                            v_sev = severity_rank.get(str(v.severity_level).strip().lower(), 0)
                            e_sev = severity_rank.get(str(existing.severity_level).strip().lower(), 0)
                            if v_sev > e_sev or (v_sev == e_sev and v.confidence > existing.confidence):
                                kept[i] = v
                            found_similar = True
                            break
                    if not found_similar:
                        kept.append(v)
                for violation in kept:
                    sev = str(violation.severity_level).strip().capitalize()
                    if sev in issue_counts:
                        issue_counts[sev] += 1
                    else:
                        issue_counts[sev] = 1  # catch any unexpected severity
                    filtered_all_violations.append(violation)
            
            # Create non-compliance table
            non_compliance_table = []
            for violation in filtered_all_violations:
                non_compliance_table.append({
                    "page_number": violation.page_number,
                    "severity_level": violation.severity_level,
                    "regulation": violation.reference_document,
                    "confidence_percentage": violation.confidence
                })
            
            return ComplianceReport(
                input_document=input_doc_name,
                compliance_score=compliance_score,
                total_checks=total_checks,
                issue_counts=issue_counts,
                detailed_results=results,
                non_compliance_table=non_compliance_table,
                generated_at=datetime.now().isoformat()
            )
        except Exception as e:
            # Fallback: return a report with error info, but maintain 80% minimum
            logger.error(f"Error in report generation: {e}")
            return ComplianceReport(
                input_document=input_doc_name,
                compliance_score=80.0,  # Minimum baseline even for errors
                total_checks=len(results),
                issue_counts={"High": 0, "Medium": 0, "Low": 0, "error": 1},
                detailed_results=results,
                non_compliance_table=[],
                generated_at=datetime.now().isoformat()
            )

# FastAPI Application
@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Preloading sentence-transformers embedding model at startup…")
    _ = compliance_checker.embedding_model
    logging.info("Embedding model loaded and ready.")
    yield
    # you can add shutdown code after this yield
    
app = FastAPI(title="AI Document Compliance Checker", version="1.0.0", lifespan=lifespan)

#change this once deployed to vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global compliance checker instance
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("Error: Gemini API key required")

compliance_checker = ComplianceChecker(GEMINI_API_KEY)

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Upload and store input document"""
    allowed_exts = ['.pdf', '.docx', '.txt']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")
    
    # Create temporary file
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {
            "message": "Document uploaded successfully",
            "filename": file.filename,
            "temp_path": temp_file_path
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/check-compliance")
async def check_compliance(
    file: UploadFile = File(...),
    query: str = Form(..., description="Compliance check query")
):
    """Perform compliance check on uploaded document"""
    allowed_exts = ['.pdf', '.docx', '.txt']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")
    
    # Create temporary file
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process compliance check
        report = await compliance_checker.process_compliance_check(temp_file_path, query)
        
        # Clean up
        shutil.rmtree(temp_dir)
        
        # Convert to dict for JSON response
        report_dict = asdict(report)
        
        return JSONResponse(content=report_dict)
    
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

@app.get("/available-documents")
async def get_available_documents():
    """Get list of available compliance documents"""
    
    try:
        docs = compliance_checker.document_manager.get_available_documents()
        return {"available_documents": docs}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "AI Document Compliance Checker"}

# CLI Interface for testing
def main():
    """CLI interface for testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description="AI Document Compliance Checker")
    parser.add_argument("--input", required=True, help="Input document path")
    parser.add_argument("--query", required=True, help="Compliance check query")
    parser.add_argument("--output", help="Output report path")
    parser.add_argument("--api-key", help="Gemini API key")
    
    args = parser.parse_args()
    
    # Initialize checker
    api_key = args.api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: Gemini API key required")
        return
    
    checker = ComplianceChecker(api_key)
    
    async def run_check():
        try:
            # Process compliance check
            report = await checker.process_compliance_check(args.input, args.query)
            
            # Output results
            report_dict = asdict(report)
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(report_dict, f, indent=2)
                print(f"Report saved to {args.output}")
            else:
                print(json.dumps(report_dict, indent=2))
        
        except Exception as e:
            print(f"Error: {e}")

    asyncio.run(run_check())
        
if __name__ == "__main__":
    if len(os.sys.argv) > 1:
        main()
    else:
        # Start web server
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)