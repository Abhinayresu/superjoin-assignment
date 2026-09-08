import sys
import os
sys.path.insert(0, os.path.abspath("."))
from src.pdf_parser import PDFParser

chunks = PDFParser.parse_pdf("dataset/starter-datasets/delhivery/02-delhivery-annual-report-fy24-excerpt.pdf")
p60 = next((c for c in chunks if c.page_number == 60), None)
if p60:
    print("PAGE 60 TEXT:")
    print(p60.text[:1000])
