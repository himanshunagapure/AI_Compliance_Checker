# 🧠 AI Document Compliance Checker - Backend

A powerful AI-powered document compliance checking system that analyzes documents against regulatory requirements using Google's Gemini AI.  
The system identifies violations, explains them clearly, and creates full compliance reports.

---
# 📄 About `main.py` (Technical Overview)

`main.py` is the core backend engine for the AI Document Compliance Checker. It is a robust, modular FastAPI application that leverages Google Gemini AI, semantic embeddings, and advanced document processing to automate compliance analysis of uploaded documents against regulatory requirements.

---

# 📊 Compliance Score Calculation

The compliance score reflects how well a document meets regulatory requirements, using a transparent, severity-weighted system. **All scores are between 80% and 100%.**

## Score Ranges
| Score Range | Meaning                       | Action/Status                |
|-------------|-------------------------------|------------------------------|
| 95-100%     | Fully compliant               | ✅ Approve                   |
| 90-94%      | Good compliance               | 📝 Minor review              |
| 85-89%      | Acceptable, some violations   | 🔍 Detailed review           |
| 80-84%      | Minimum compliance threshold  | ⚠️ Mandatory review          |

## Base Scores
- **Fully Compliant:** 100% (no violations)
- **Partially Compliant:** 95% (minor gaps)
- **With Violations:** 90% (regulatory issues found)
- **Minimum Score:** 80% (floor, never goes lower)

## Penalty Matrix
| Severity   | Deduction per Violation | Max Deduction | Color   |
|------------|------------------------|--------------|---------|
| High       | -2 points              | -10 points   | 🔴      |
| Medium     | -1 point               | -5 points    | 🟡      |
| Low        | -0.5 points            | -3 points    | 🟢      |

## Calculation Rules
- **Penalties** are subtracted from the base score according to violation severity.
- **Floor Protection:** Score never drops below 80%.
- **Severity Priority:** High-severity violations are penalized first.
- **Error Handling:** If errors occur, score defaults to 80% with an error flag.

### Example Calculation
```
Base Score: 95%
Violations: 2 High, 1 Medium, 3 Low
Calculation: 95% - (2×2) - (1×1) - (3×0.5) = 95% - 6.5% = 88.5%
Final Score: 88.5%
```

---
## 🏗️ Architecture & Main Components

### 1. **Data Models (Dataclasses)**
- **ViolationDetail**: Represents a single compliance violation, including page, section, explanation, severity, and confidence.
- **ComplianceResult**: Holds the result of checking one compliance document, including all violations and token usage.
- **ComplianceReport**: Aggregates results for a user-uploaded document, with overall score, issue counts, and a non-compliance summary table.

### 2. **Document Processing**
- **DocumentProcessor**: Static methods to extract text from PDF (using PyMuPDF and PyPDF2), DOCX, and TXT files. Also includes section extraction logic for structured analysis.

### 3. **AI Compliance Analysis**
- **AIComplianceChecker**: Wraps Gemini API calls. Builds detailed prompts, parses/cleans AI JSON responses, deduplicates violations, and handles error fallback. Supports async operation for scalable API use.

### 4. **Compliance Document Management**
- **ComplianceDocumentManager**: Handles caching and retrieval of compliance documents (as text), and implements smart document selection based on user queries (explicit, keyword, fuzzy, or fallback to all).

### 5. **Semantic Relevance & Embeddings**
- **ComplianceChecker**: Orchestrates the full compliance check. Uses SentenceTransformers to compute semantic similarity between input document pages and compliance documents, selecting the most relevant content for AI analysis. Handles parallel processing for multiple compliance docs.
- Embeddings for compliance docs are precomputed and cached for efficiency.

### 6. **API & CLI**
- **FastAPI Endpoints**:
  - `POST /upload-document`: Upload a document (PDF, DOCX, TXT) for analysis.
  - `POST /check-compliance`: Main endpoint. Upload a document and query; returns a detailed compliance report.
  - `GET /available-documents`: Lists all compliance documents available for checking.
  - `GET /health`: Health check endpoint.
- **CLI Interface**: Run compliance checks from the command line for local testing or batch jobs.

---

## 🔄 Flow Overview
1. **User uploads a document** (via API or CLI).
2. **Text is extracted** page-wise (PDF) or as a whole (DOCX/TXT).
3. **Relevant compliance documents are selected** based on the query (explicit, keyword, fuzzy, or fallback).
4. **Semantic similarity** is computed between input pages and compliance docs to select the most relevant content for each check.
5. **AI (Gemini) is prompted** with both the input and compliance text, returning a structured JSON of violations, explanations, and remedies.
6. **Results are aggregated** into a comprehensive report, with severity-weighted scoring, deduplication, and a summary table.
7. **API returns the report** (or CLI prints/saves it).

---

## ⚙️ Extensibility & Design Notes
- **Async/Parallel**: All heavy operations (AI calls, embedding similarity) are async/threaded for scalability.
- **Pluggable Models**: Easy to swap out Gemini for another LLM or add more embedding models.
- **Smart Document Selection**: Query parsing supports explicit, keyword, and fuzzy matching for robust user experience.
- **Error Handling**: Graceful fallback for extraction, AI, and JSON parsing errors; always returns a valid report.
- **Token Usage Tracking**: Tracks and logs token usage for each AI call for cost/usage monitoring.
- **Security**: Validates uploads, cleans up temp files, and supports CORS.

---

## 🚀 Features

- **PDF Document Support:** PDF files  
- **AI-Powered Analysis:** Uses Google Gemini 2.5 Flash  
- **Automatic Document Selection:** Picks the right compliance docs based on the query  
- **Detailed Reporting:** Shows violations, severity, and suggested fixes  
- **RESTful API:** Built with FastAPI, includes CORS support  
- **Token Usage Tracking:** See token usage per request  
- **Batch Processing:** Run checks against many compliance documents at once  

---

## 🛠 Installation

### Prerequisites

- Python 3.8+  
- Google Gemini API key  

### Environment Setup

Create a `.env` file or export your Gemini API key:

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### Setup Compliance Documents

Create a directory for compliance documents:

```bash
mkdir compliance_documents
```

Add your compliance PDFs into that folder.

---

## 🔧 Utility Scripts

The system includes several utility scripts to help with setup and optimization:

### `extract_compliance_texts.py`

**Purpose:** Extracts text content from all PDF compliance documents and caches them for faster processing.

**Prerequisites:**
- Place all Compliance PDFs in `compliance_documents/` folder
- Python dependencies installed

**Usage:**
```bash
python extract_compliance_texts.py
```

**What it does:**
- Processes all PDF files in `compliance_documents/`
- Extracts text content using PyMuPDF
- Saves extracted text to `compliance_text_cache/` folder
- Creates `.txt` files for each PDF for faster subsequent access

### `precompute_compliance_embeddings.py`

**Purpose:** Precomputes semantic embeddings for all compliance documents to speed up similarity searches.

**Prerequisites:**
- `GEMINI_API_KEY` environment variable set
- Compliance documents already extracted (run `extract_compliance_texts.py` first)
- Python dependencies installed

**Usage:**
```bash
python precompute_compliance_embeddings.py
```

**What it does:**
- Loads all compliance document texts from cache (`compliance_text_cache/` folder)
- Computes embeddings using SentenceTransformers
- Saves embeddings to `compliance_embeddings/` folder
- Significantly speeds up document similarity matching during compliance checks

### `precompute_playbook_sections.py`

**Purpose:** Specifically processes the MAS Regulatory Compliance Playbook, splitting it into sections and computing embeddings for each section.

**Prerequisites:**
- `MAS Regulatory Compliance Playbook.pdf` in `compliance_documents/` folder
- Python dependencies installed

**Usage:**
```bash
python precompute_playbook_sections.py
```

**What it does:**
- Extracts text from the MAS playbook PDF
- Splits content into logical sections
- Computes embeddings for each section
- Saves sections and embeddings to `playbook_embeddings/` folder
- Enables granular analysis of specific playbook sections

### Recommended Setup Order

1. **Add compliance PDFs** to `compliance_documents/` folder
2. **Extract text:** `python extract_compliance_texts.py`
3. **Precompute embeddings:** `python precompute_compliance_embeddings.py`
4. **Process playbook (if applicable):** `python precompute_playbook_sections.py`
5. **Start the server:** `python main.py`

---

## 🚀 Usage

### Run the Web Server

```bash
python main.py
```

Access the API at:  
http://localhost:8000

---

## 📚 API Documentation

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)  
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🖥 CLI Usage

```bash
python main.py --input "document.pdf" --query "check GDPR compliance" --output "report.json"
```

---

## 🔌 API Endpoints

### `POST /check-compliance`

Main endpoint to check compliance.

**Parameters:**

- `file`: Upload a file (PDF, DOCX, TXT)  
- `query`: What to check (form field)

**Example:**

```bash
curl -X POST "http://localhost:8000/check-compliance"   -F "file=@document.pdf"   -F "query=check all compliance documents"
```

---

### `GET /available-documents`

Returns the list of compliance documents.

**Response:**
```json
{
  "available_documents": ["regulation1.pdf", "policy2.pdf"]
}
```

---

### `GET /health`

Health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "AI Document Compliance Checker"
}
```

---

## 🔍 Query Examples

### Check All Documents
- `check all compliance documents`
- `perform comprehensive compliance check`
- `verify against all regulations`

### Check Specific Documents
- `check against GDPR_regulation.pdf`
- `verify HIPAA compliance using healthcare_policy.pdf`
- `analyze SOX_requirements.pdf compliance`

### Generic Checks
- `do compliance check`
- `analyze compliance`
- `verify regulatory compliance`

---

## 📊 Response Format

```json
{
  "input_document": "example.pdf",
  "compliance_score": 75.5,
  "total_checks": 3,
  "issue_counts": {
    "High": 2,
    "Medium": 5,
    "Low": 1
  },
  "detailed_results": [
    {
      "document_name": "regulation1.pdf",
      "result": "Partial",
      "explanation": "Document shows partial compliance...",
      "violations": [
        {
          "page_number": 1,
          "section": "Data Protection Section",
          "non_compliant_text": "Personal data is stored...",
          "explanation": "Data retention period exceeds regulatory limits",
          "remedy_recommendation": "Implement data retention policy...",
          "severity_level": "High",
          "confidence": 85.5,
          "result": "Violation"
        }
      ],
      "confidence_score": 88.0
    }
  ],
  "non_compliance_table": [...],
  "generated_at": "2024-01-15T10:30:00"
}
```

---

## ⚙️ Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Gemini API key (required)

### Compliance Document Setup

- Place docs in the `compliance_documents/` folder  
- PDF is preferred  
- Use clear file names for better matching

### CORS Settings (for production)

Update in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔧 Advanced Features

### Smart Document Selection

- **Explicit Name Match:** Detects file names in query  
- **Keyword Match:** Based on content  
- **Fuzzy Matching:** Handles small name differences  
- **Pattern Recognition:** Detects phrases like "check all"  
- **Fallback:** Uses all documents when unsure

### Violation Detection

- Severity: High / Medium / Low  
- Confidence scoring per finding  
- Duplicate removal  
- Understands structure and context

### Token Usage Monitor

- Tracks input/output token count per request

---

## 🚨 Error Handling

Handles:

- Wrong file formats  
- Processing errors  
- Parsing failures  
- Missing docs  
- Rate limiting  
- Connection issues

---

## 📝 Logging

Uses standard logging:

```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

---

## 🔐 Security

- API key stored in `.env`  
- Validates and sanitizes uploads  
- Cleans up temp files  
- CORS for safe frontend access  
- Input checks for safety

---

## 🚀 Deployment

### Local

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

RUN apt-get update && apt-get install -y     tesseract-ocr     poppler-utils     && rm -rf /var/lib/apt/lists/*

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

> 🔗 **Note:** This is the **backend** of the AI Document Compliance Checker system.
