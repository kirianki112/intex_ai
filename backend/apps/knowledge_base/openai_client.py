import os
from openai import OpenAI
from django.conf import settings

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

EMBEDDING_MODEL = getattr(settings, "KB_EMBEDDING_MODEL", "text-embedding-3-small")
CHAT_MODEL = getattr(settings, "KB_CHAT_MODEL", "gpt-3.5-turbo")

def embed_texts(texts: list, batch_size: int = 64) -> list:
    """
    Takes a list of strings, returns list of vectors (floats).
    """
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch
        )
        batch_embs = [item.embedding for item in response.data]
        results.extend(batch_embs)
    return results

def chat_with_context(system_prompt: str, user_question: str, context_chunks: list, max_tokens=512, temperature=0.2):
    """
    context_chunks: list of dicts {'text': ..., 'source': ..., 'score': ...}
    We'll build a system + context + user message and call chat completion.
    """
    # Build a compact context
    context_text = "\n\n".join([f"Source: {c['source']}\n{c['text'][:1000]}" for c in context_chunks])
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {user_question}"},
    ]
    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content