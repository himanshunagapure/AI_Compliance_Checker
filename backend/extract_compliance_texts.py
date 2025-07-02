import os
from pathlib import Path
from main import DocumentProcessor

pdf_dir = Path("compliance_documents")
cache_dir = Path("compliance_text_cache")
cache_dir.mkdir(exist_ok=True)

for pdf_file in pdf_dir.glob("*.pdf"):
    text = DocumentProcessor.extract_text_from_pdf(str(pdf_file))
    out_file = cache_dir / (pdf_file.stem + ".txt")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n\n".join(text.values()))
    print(f"Extracted: {pdf_file.name} -> {out_file.name}") 