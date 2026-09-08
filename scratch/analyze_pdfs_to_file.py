import os
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))
import glob
from src.pdf_parser import PDFParser

parser = PDFParser()

out_file = open("scratch/pdf_analysis.txt", "w", encoding="utf-8")

def log(msg=""):
    print(msg)
    out_file.write(str(msg) + "\n")

def analyze_pdf_set(folder_name):
    log(f"\n=======================================================")
    log(f"ANALYZING PDF SET: {folder_name}")
    log(f"=======================================================")
    files = sorted(glob.glob(os.path.join('dataset', 'starter-datasets', folder_name, '*.pdf')))
    
    doc_chunks = {}
    for f in files:
        bname = os.path.basename(f)
        chunks = parser.parse_pdf(f)
        doc_chunks[bname] = chunks
        log(f"Doc: {bname} -> {len(chunks)} pages")

    # Search for key terms
    keywords = ["revenue", "gdp", "growth", "inflation", "cpi", "ebitda", "profit", "headcount", "express parcel", "pin code", "pincode", "network"]
    
    for kw in keywords:
        log(f"\n--- KEYWORD SEARCH: '{kw}' ---")
        for doc_name, chunks in doc_chunks.items():
            for c in chunks:
                if kw in c.text.lower():
                    lines = [line.strip() for line in c.text.splitlines() if kw in line.lower() and any(ch.isdigit() for ch in line)]
                    if lines:
                        log(f"[{doc_name} p.{c.page_number}]:")
                        for l in lines[:4]:
                            log(f"   {l[:140]}")

analyze_pdf_set('delhivery')
analyze_pdf_set('india-macroeconomy')

out_file.close()
log("DONE ANALYZING")
