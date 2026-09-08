import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import glob
from src.pdf_parser import PDFParser

parser = PDFParser()

def analyze_pdf_set(folder_name):
    print(f"\n=======================================================")
    print(f"ANALYZING PDF SET: {folder_name}")
    print(f"=======================================================")
    files = sorted(glob.glob(os.path.join('dataset', 'starter-datasets', folder_name, '*.pdf')))
    
    doc_chunks = {}
    for f in files:
        bname = os.path.basename(f)
        chunks = parser.parse_pdf(f)
        doc_chunks[bname] = chunks
        print(f"Doc: {bname} -> {len(chunks)} pages")

    # Search for key terms
    keywords = ["revenue", "gdp", "growth", "inflation", "cpi", "ebitda", "profit", "headcount", "employee", "fiscal", "express parcel", "pin code", "pincode", "network", "2024", "2023", "2025", "fy24", "fy25", "fy23"]
    
    for kw in ["revenue", "gdp", "inflation", "cpi", "ebitda", "headcount", "express parcel", "pin code"]:
        print(f"\n--- KEYWORD SEARCH: '{kw}' ---")
        for doc_name, chunks in doc_chunks.items():
            for c in chunks:
                if kw in c.text.lower():
                    lines = [line.strip() for line in c.text.splitlines() if kw in line.lower() and any(ch.isdigit() for ch in line)]
                    if lines:
                        print(f"[{doc_name} p.{c.page_number}]:")
                        for l in lines[:3]:
                            print(f"   {l[:120]}")

analyze_pdf_set('delhivery')
analyze_pdf_set('india-macroeconomy')
