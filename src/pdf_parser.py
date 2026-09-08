import os
from typing import List
import pypdf
from src.schema import PDFPageChunk

class PDFParser:
    """Parses PDF documents and extracts text chunks mapped to exact page numbers."""

    @staticmethod
    def parse_pdf(file_path: str) -> List[PDFPageChunk]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at path: {file_path}")

        doc_name = os.path.basename(file_path)
        chunks: List[PDFPageChunk] = []

        reader = pypdf.PdfReader(file_path)
        total_pages = len(reader.pages)

        for page_idx, page in enumerate(reader.pages):
            page_number = page_idx + 1
            raw_text = page.extract_text() or ""
            
            # Clean text lightly while preserving formatting structure
            clean_lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
            clean_text = "\n".join(clean_lines)

            if clean_text:
                chunks.append(PDFPageChunk(
                    doc_name=doc_name,
                    page_number=page_number,
                    text=clean_text
                ))

        return chunks
