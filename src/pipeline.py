import os
import json
import logging
from typing import List, Dict
from src.pdf_parser import PDFParser
from src.fact_extractor import GroundedFactExtractor
from src.schema import ExtractedFact, IngestionResult

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class FactPipeline:
    """Orchestrates PDF ingestion, page-level tracking, and grounded fact extraction for multiple PDFs."""

    def __init__(self, api_key: str = None):
        self.parser = PDFParser()
        self.extractor = GroundedFactExtractor(api_key=api_key)

    def process_pdf(self, pdf_path: str) -> IngestionResult:
        logger.info(f"Processing PDF: {pdf_path}")
        chunks = self.parser.parse_pdf(pdf_path)
        doc_name = os.path.basename(pdf_path)
        total_pages = max([c.page_number for c in chunks], default=0)

        logger.info(f"Extracted {len(chunks)} page chunks from {total_pages} pages in '{doc_name}'")

        facts = self.extractor.extract_from_chunks(chunks)
        logger.info(f"Extracted {len(facts)} grounded facts from '{doc_name}'")

        return IngestionResult(
            doc_name=doc_name,
            total_pages=total_pages,
            extracted_facts_count=len(facts),
            facts=facts
        )

    def process_multiple_pdfs(self, pdf_paths: List[str]) -> Dict[str, IngestionResult]:
        results: Dict[str, IngestionResult] = {}
        for path in pdf_paths:
            try:
                res = self.process_pdf(path)
                results[res.doc_name] = res
            except Exception as e:
                logger.error(f"Failed to process {path}: {e}")
        return results

    def save_facts_to_json(self, results: Dict[str, IngestionResult], output_path: str = "extracted_facts.json"):
        all_facts = []
        for doc_res in results.values():
            for fact in doc_res.facts:
                all_facts.append(fact.model_dump())

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_facts, f, indent=2, ensure_ascii=False)
        logger.info(f"Successfully saved {len(all_facts)} facts to {output_path}")
