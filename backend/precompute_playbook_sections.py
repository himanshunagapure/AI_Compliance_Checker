import os
import pickle
from pathlib import Path
from main import DocumentProcessor
from sentence_transformers import SentenceTransformer

PLAYBOOK_PDF = "compliance_documents/MAS Regulatory Compliance Playbook.pdf"
PLAYBOOK_TXT = "playbook_text_cache/MAS Regulatory Compliance Playbook.txt"
CACHE_DIR = Path("playbook_embeddings")
CACHE_DIR.mkdir(exist_ok=True)
CACHE_FILE = CACHE_DIR / "playbook_sections_and_embeddings.pkl"

# Extract text if not already done
if not os.path.exists(PLAYBOOK_TXT):
    print("Extracting playbook text...")
    text = DocumentProcessor.extract_text_from_pdf(PLAYBOOK_PDF)
    with open(PLAYBOOK_TXT, "w", encoding="utf-8") as f:
        f.write("\n\n".join(text.values()))
else:
    print("Playbook text already extracted.")

# Split into sections
with open(PLAYBOOK_TXT, "r", encoding="utf-8") as f:
    playbook_text = f.read()
sections = DocumentProcessor.extract_sections(playbook_text)
section_texts = list(sections.values())

# Compute embeddings
print(f"Computing embeddings for {len(section_texts)} playbook sections...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
section_embeddings = embedding_model.encode(section_texts, convert_to_numpy=True)

# Save both sections and embeddings
with open(CACHE_FILE, "wb") as f:
    pickle.dump({
        "sections": section_texts,
        "embeddings": section_embeddings
    }, f)
print(f"Playbook section embeddings cached at {CACHE_FILE}") 