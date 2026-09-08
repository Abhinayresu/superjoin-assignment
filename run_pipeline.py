import os
import sys
import glob
import argparse
from src.pipeline import FactPipeline

def main():
    parser = argparse.ArgumentParser(description="Multi-PDF Grounded Fact Extraction Pipeline")
    parser.add_argument("--pdf_dir", type=str, help="Directory containing PDF files to ingest")
    parser.add_argument("--files", nargs="+", help="Specific PDF file paths to ingest")
    parser.add_argument("--output", type=str, default="extracted_facts.json", help="Path to save extracted JSON facts")

    args = parser.parse_args()

    pdf_files = []
    if args.files:
        pdf_files = args.files
    elif args.pdf_dir:
        pdf_files = glob.glob(os.path.join(args.pdf_dir, "*.pdf"))
    else:
        # Default to delhivery starter dataset if present
        default_dir = os.path.join("dataset", "starter-datasets", "delhivery")
        if os.path.exists(default_dir):
            pdf_files = glob.glob(os.path.join(default_dir, "*.pdf"))

    if not pdf_files:
        print("No PDF files specified or found.")
        sys.exit(1)

    print(f"==================================================")
    print(f"Fact Knowledge Layer - PDF Ingestion & Extraction")
    print(f"Found {len(pdf_files)} PDF(s) to process:")
    for f in pdf_files:
        print(f" - {f}")
    print(f"==================================================\n")

    pipeline = FactPipeline()
    results = pipeline.process_multiple_pdfs(pdf_files)

    pipeline.save_facts_to_json(results, output_path=args.output)

    print(f"\n[SUMMARY]")
    total_facts = 0
    for doc_name, res in results.items():
        print(f"📄 {doc_name}: {res.total_pages} pages | {res.extracted_facts_count} facts extracted")
        total_facts += res.extracted_facts_count

    print(f"\n✅ Total Extracted & Grounded Facts: {total_facts}")
    print(f"📁 Extracted facts saved to: {os.path.abspath(args.output)}")

if __name__ == "__main__":
    main()
