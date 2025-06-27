# 🧠 AI Document Compliance Checker - Backend

A powerful AI-powered document compliance checking system that analyzes documents against regulatory requirements using Google's Gemini AI.  
The system identifies violations, explains them clearly, and creates full compliance reports.

---

## 🚀 Features

- **Multi-format Document Support:** PDF, DOCX, and TXT files  
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
- Tesseract OCR (for image-based PDFs)

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
- **Pattern Recognition:** Detects phrases like “check all”  
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
