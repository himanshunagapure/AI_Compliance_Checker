from main import ComplianceChecker
import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment or .env file.")
    exit(1)

checker = ComplianceChecker(api_key)
checker.precompute_compliance_embeddings()
print("All compliance document embeddings have been precomputed and cached.") 