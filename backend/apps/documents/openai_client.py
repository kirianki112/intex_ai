# --- START OF FILE openai_client.py ---

import logging
import openai
import json
from tavily import TavilyClient
from django.conf import settings

logger = logging.getLogger(__name__)

# --- CLIENT INITIALIZATION ---
# Initialize the OpenAI and Tavily clients using API keys from Django settings
try:
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)
except AttributeError as e:
    logger.error("Missing API key in Django settings: %s", e)
    # You might want to raise the exception or handle it gracefully
    raise

# --- TOOL DEFINITION FOR TAVILY WEB SEARCH ---
# This schema tells the OpenAI model how to use our web search tool.
tools = [
    {
        "type": "function",
        "function": {
            "name": "tavily_search",
            "description": "Get information from the web to answer user questions, find recent data, or verify facts. Use this for any queries that require up-to-date information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to use. For example: 'latest economic growth statistics in Kenya'",
                    }
                },
                "required": ["query"],
            },
        },
    }
]

def execute_tool_call(tool_call, start_index=1):
    """Executes a tool call (e.g., Tavily search) and formats the results for the model."""
    if tool_call.function.name == "tavily_search":
        try:
            query = json.loads(tool_call.function.arguments)["query"]
            logger.info("Executing Tavily search for query: '%s'", query)
            # Execute the search
            search_results = tavily_client.search(query, search_depth="advanced")

            # Format results for the model and for citation output
            formatted_results = "\n\n--- Web Search Results ---\n"
            citations_out = []

            for idx, result in enumerate(search_results.get("results", []), start_index):
                # For the model's context
                formatted_results += f"Source [{idx}]: {result.get('content', '')}\n"
                # For the final citation list
                citations_out.append({
                    "marker": f"[{idx}]",
                    "reference_text": f"Web: {result.get('title', '')} - {result.get('url', '')}",
                    "kb_document_id": None,
                    "confidence_score": result.get('score', None),
                })

            return formatted_results, citations_out
        except Exception as e:
            logger.error("Error during Tavily search: %s", e)
            return f"Error performing search: {e}", []
    return None, []


def generate_draft(prompt, template=None, kb_chunks=None, model=None):
    """Generate a draft using Knowledge Base chunks and Tavily-powered web search."""
    system_prompt_base = settings.DOC_SYSTEM_PROMPT or (
        "You are an expert proposal writer specializing in Kenyan project concept notes and proposals. "
        "Generate professional, cohesive content in a formal tone. Use the provided Knowledge Base chunks and, if necessary, web search results to find current information. "
        "Ensure all sources are cited with markers like [1], [2], etc. "
        "Use markdown for formatting, especially for tables (e.g., | Column1 | Column2 |). "
        "Maintain consistent terminology and align with Kenyan development contexts (e.g., MTEF sectors, KShs)."
    )

    # Build user input
    input_content = prompt
    if template:
        input_content += f"\n\nStructure the content for: '{template}'"

    model = model or settings.DOC_GEN_MODEL or "gpt-4-turbo" # Using a modern model that's good with tools

    # Prepare Knowledge Base context and citations
    kb_context = ""
    citations_out = []
    if kb_chunks:
        kb_context = "\n\n--- Knowledge Base Sources ---\n"
        for idx, chunk in enumerate(kb_chunks, 1):
            citations_out.append({
                "marker": f"[{idx}]",
                "reference_text": f"Knowledge Base: {chunk['title']} (Chunk {chunk['chunk_index']})",
                "kb_document_id": chunk['document_id'],
                "confidence_score": chunk['score'],
            })
            kb_context += f"Source [{idx}]: {chunk['text']}\n"
        input_content += kb_context

    messages = [
        {"role": "system", "content": system_prompt_base},
        {"role": "user", "content": input_content},
    ]

    try:
        # First API call - let the model decide if it needs tools
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )
        response_message = response.choices[0].message

        # Check if the model wants to call a tool
        if response_message.tool_calls:
            messages.append(response_message)  # Append the model's tool request
            
            tool_call = response_message.tool_calls[0] # Assuming one tool call for simplicity
            
            # Execute the tool call and get formatted results and citations
            # Start web citation markers after KB markers
            tool_response_content, web_citations = execute_tool_call(tool_call, start_index=len(citations_out) + 1)
            citations_out.extend(web_citations)

            # Append the tool's response to the message history
            messages.append(
                {"role": "tool", "tool_call_id": tool_call.id, "name": tool_call.function.name, "content": tool_response_content}
            )

            # Second API call - get the final response using the tool's output
            final_response = client.chat.completions.create(
                model=model,
                messages=messages,
            )
            content = final_response.choices[0].message.content or ""
        else:
            # If no tool was called, the first response is the final one
            content = response_message.content or ""

        return {"content": content, "citations": citations_out}

    except Exception as e:
        logger.error("OpenAI API error in generate_draft: %s", str(e), exc_info=True)
        raise Exception(f"OpenAI API error: {str(e)}")


def refine_document(document_text, instruction, model=None):
    """Refine existing content using Tavily-powered web search for fact-checking and updates."""
    system_prompt = (
        "You are an expert editor for Kenyan project concept notes and proposals. "
        "Make precise edits based on the user's instruction. Preserve existing citation markers ([1], [2], etc.) and markdown formatting. "
        "If the instruction requires fact-checking, finding the latest statistics, or adding new references, use the web search tool. "
        "When you use web search, add new citations for the new information."
    )
    model = model or settings.DOC_GEN_MODEL or "gpt-4-turbo"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Document:\n{document_text}\n\nInstruction: {instruction}"},
    ]

    try:
        # First API call
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )
        response_message = response.choices[0].message
        logger.debug("Refine raw response 1: %s", response.model_dump_json(indent=2))

        citations_out = []
        # Check if the model wants to call a tool
        if response_message.tool_calls:
            messages.append(response_message)
            tool_call = response_message.tool_calls[0]
            
            # Execute search and get results + citations
            tool_response_content, web_citations = execute_tool_call(tool_call)
            citations_out.extend(web_citations)

            messages.append(
                {"role": "tool", "tool_call_id": tool_call.id, "name": tool_call.function.name, "content": tool_response_content}
            )
            
            # Second API call for the final refined content
            final_response = client.chat.completions.create(
                model=model,
                messages=messages,
            )
            refined_content = final_response.choices[0].message.content or ""
        else:
            refined_content = response_message.content or ""

        return {"content": refined_content, "citations": citations_out}

    except Exception as e:
        logger.error("OpenAI refine error: %s", str(e), exc_info=True)
        raise Exception(f"OpenAI refine error: {str(e)}")