import os
import sys
sys.path.insert(0, os.path.abspath('.'))
import re
from src.pdf_parser import PDFParser

parser = PDFParser()
chunks = parser.parse_pdf("dataset/starter-datasets/delhivery/03-delhivery-q4-fy24-earnings-presentation.pdf")

print(f"Parsed {len(chunks)} chunks from earnings presentation")

patterns = [
    re.compile(r'([A-Za-z0-9\s,\-\(\)\/]{4,50}?)\s+([₹\$€]?\s*(?:Rs\.?\s*)?\d+(?:[\.,]\d+)?\s*(?:Cr|crore|Mn|million|b|%)?)\b', re.I),
    re.compile(r'(EBITDA|Revenue|Services|Loss|PAT|Parcel|Freight|Income|Capex)[^\n]*?(\d+(?:[\.,]\d+)?\s*(?:Cr|Mn|%)?)', re.I)
]

for c in chunks:
    lines = c.text.splitlines()
    for l in lines:
        l_str = l.strip()
        if any(kw in l_str.lower() for kw in ["ebitda", "revenue", "loss", "pat", "parcel", "freight"]):
            print(f"[Page {c.page_number}]: {l_str}")
