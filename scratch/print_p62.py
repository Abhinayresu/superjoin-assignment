import sys
import os
sys.path.insert(0, os.path.abspath("."))
from src.pdf_parser import PDFParser

chunks = PDFParser.parse_pdf("dataset/starter-datasets/delhivery/02-delhivery-annual-report-fy24-excerpt.pdf")
p62 = next((c for c in chunks if c.page_number == 62), None)
if p62:
    print("PAGE 62 TEXT:")
    print(p62.text[:1500])
