"""
Token-aware chunker using tiktoken to estimate tokens.
Produces overlapping chunks.
"""
from typing import List
import tiktoken
import math

# defaults can be overridden in settings
DEFAULT_CHUNK_TOKENS = 900
DEFAULT_OVERLAP = 150
ENCODING_NAME = "cl100k_base"  # works for OpenAI embeddings

def count_tokens(text: str, encoding_name=ENCODING_NAME) -> int:
    enc = tiktoken.get_encoding(encoding_name)
    return len(enc.encode(text))

def chunk_text(text: str, chunk_size=DEFAULT_CHUNK_TOKENS, overlap=DEFAULT_OVERLAP) -> List[str]:
    # naive split by paragraphs then join lines until token budget reached
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks = []
    current = []
    current_tokens = 0
    for p in paragraphs:
        ptokens = count_tokens(p)
        if current_tokens + ptokens <= chunk_size or not current:
            current.append(p)
            current_tokens += ptokens
        else:
            chunks.append("\n".join(current))
            # start new chunk with overlap: include last tokens from current chunk
            if overlap > 0:
                # grab last paragraphs to serve as overlap heuristically
                overlap_text = ""
                otokens = 0
                for segment in reversed(current):
                    seg_t = count_tokens(segment)
                    if otokens + seg_t > overlap:
                        break
                    overlap_text = segment + "\n" + overlap_text
                    otokens += seg_t
                current = [overlap_text.strip()] if overlap_text.strip() else []
                current_tokens = otokens
            else:
                current = []
                current_tokens = 0
            current.append(p)
            current_tokens += ptokens
    if current:
        chunks.append("\n".join(current))
    return chunks
