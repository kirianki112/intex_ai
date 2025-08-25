"""
File extractors for PDF, DOCX, DOC, TXT, CSV/Excel.
Return a plain-text string and optional page count.
"""
import io
import os
import logging
import pdfplumber
import docx
import docx2txt
import pandas as pd
from typing import Tuple

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> Tuple[str, int]:
    """
    Extract text from PDF files using pdfplumber.
    Returns text and page count.
    """
    try:
        texts = []
        pages = 0
        with pdfplumber.open(file_path) as pdf:
            pages = len(pdf.pages)
            for p in pdf.pages:
                txt = p.extract_text() or ""
                texts.append(txt)
        extracted_text = "\n\n".join(texts)
        logger.info(f"Extracted {pages} pages from PDF: {file_path}")
        return extracted_text, pages
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {file_path}: {str(e)}")
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_docx(file_path: str) -> Tuple[str, int]:
    """
    Extract text from DOCX files using python-docx.
    Returns text and None for page count (not easily available).
    """
    try:
        doc = docx.Document(file_path)
        texts = [p.text for p in doc.paragraphs if p.text.strip()]
        extracted_text = "\n\n".join(texts)
        logger.info(f"Extracted text from DOCX: {file_path}")
        return extracted_text, None
    except Exception as e:
        logger.error(f"Failed to extract text from DOCX {file_path}: {str(e)}")
        raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

def extract_text_from_doc(file_path: str) -> Tuple[str, int]:
    """
    Extract text from .doc files using docx2txt.
    Returns text and None for page count (not reliably available).
    """
    try:
        text = docx2txt.process(file_path)
        logger.info(f"Extracted text from DOC: {file_path}")
        return text, None
    except Exception as e:
        logger.error(f"Failed to extract text from DOC {file_path}: {str(e)}")
        raise ValueError(f"Failed to extract text from DOC: {str(e)}")

def extract_text_from_txt(file_path: str) -> Tuple[str, int]:
    """
    Extract text from TXT files.
    Returns text and None for page count.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        logger.info(f"Extracted text from TXT: {file_path}")
        return content, None
    except Exception as e:
        logger.error(f"Failed to extract text from TXT {file_path}: {str(e)}")
        raise ValueError(f"Failed to extract text from TXT: {str(e)}")

def extract_text_from_excel(file_path: str) -> Tuple[str, int]:
    """
    Extract text from Excel/CSV files using pandas, handling multiple sheets.
    Returns text and total row count across sheets as page count equivalent.
    """
    try:
        ext = os.path.splitext(file_path)[1].lower()
        lines = []
        total_rows = 0

        # Try common encodings for CSV files
        csv_encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
        
        if ext in [".xls", ".xlsx"]:
            try:
                # Use openpyxl as primary engine (handles both .xlsx and .xls in newer versions)
                xl = pd.ExcelFile(file_path, engine='openpyxl')

                for sheet_name in xl.sheet_names:
                    try:
                        df = pd.read_excel(
                            file_path, 
                            sheet_name=sheet_name, 
                            dtype=str,
                            engine='openpyxl'  # Use openpyxl consistently
                        )
                        
                        # Add sheet separator for multi-sheet files
                        if len(xl.sheet_names) > 1:
                            lines.append(f"Sheet: {sheet_name}")
                        
                        if not df.empty:
                            # Clean and add headers
                            clean_headers = [str(col).strip() for col in df.columns if str(col).strip()]
                            if clean_headers:
                                headers = " | ".join(clean_headers)
                                lines.append(f"Headers: {headers}")
                            
                            # Process rows with better handling
                            for _, row in df.fillna("").iterrows():
                                row_values = [str(v).strip() for v in row.tolist() if str(v).strip() and str(v) != 'nan']
                                if row_values:  # Only add non-empty rows
                                    row_text = " | ".join(row_values)  # Use pipe separator for better structure
                                    lines.append(row_text)
                            
                            total_rows += df.shape[0]
                        
                        logger.info(
                            f"Extracted {df.shape[0]} rows from sheet '{sheet_name}' "
                            f"in Excel: {file_path}"
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to process sheet '{sheet_name}' in {file_path}: {str(e)}"
                        )
                        continue
                        
            except Exception as e:
                raise ValueError(f"Failed to process Excel file {file_path}: {str(e)}")

        elif ext == ".csv":
            last_error = None
            success = False
            
            # Try multiple encodings with different error handling strategies
            for encoding in csv_encodings:
                try:
                    # First try with strict error handling
                    df = pd.read_csv(
                        file_path, 
                        dtype=str, 
                        encoding=encoding,
                        on_bad_lines='skip'
                    )
                    success = True
                except UnicodeDecodeError:
                    # If Unicode fails, try with error handling
                    try:
                        df = pd.read_csv(
                            file_path, 
                            dtype=str, 
                            encoding=encoding,
                            encoding_errors='ignore',
                            on_bad_lines='skip'
                        )
                        success = True
                    except Exception as e:
                        last_error = e
                        continue
                except Exception as e:
                    last_error = e
                    continue
                
                if success:
                    # Clean and add headers
                    clean_headers = [str(col).strip() for col in df.columns if str(col).strip()]
                    if clean_headers:
                        headers = " | ".join(clean_headers)
                        lines.append(f"Headers: {headers}")
                    
                    # Process rows
                    for _, row in df.fillna("").iterrows():
                        row_values = [str(v).strip() for v in row.tolist() if str(v).strip() and str(v) != 'nan']
                        if row_values:  # Only add non-empty rows
                            row_text = " | ".join(row_values)  # Use pipe separator
                            lines.append(row_text)
                    
                    total_rows = df.shape[0]
                    logger.info(f"Extracted {total_rows} rows from CSV: {file_path} using {encoding} encoding")
                    break  # Success - exit encoding loop
            
            if not success and last_error:
                raise ValueError(
                    f"Failed to read CSV file with tried encodings {csv_encodings}. "
                    f"Last error: {str(last_error)}"
                )
        else:
            raise ValueError(f"Unsupported file extension for Excel/CSV processing: {ext}")

        if not lines:
            raise ValueError("No valid content extracted from Excel/CSV file")
        
        extracted_text = "\n".join(lines)
        logger.info(f"Total {total_rows} rows extracted from {file_path}")
        return extracted_text, total_rows
        
    except ImportError as e:
        logger.error(f"Missing openpyxl library: {str(e)}")
        raise ValueError(
            "Excel processing requires openpyxl. "
            "Please install with: pip install openpyxl"
        )
    except Exception as e:
        logger.error(f"Failed to extract text from Excel/CSV {file_path}: {str(e)}")
        raise ValueError(f"Failed to extract text from Excel/CSV: {str(e)}")