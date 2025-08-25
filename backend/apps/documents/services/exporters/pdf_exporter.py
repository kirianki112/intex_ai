import io
from xhtml2pdf import pisa
from markdown_it import MarkdownIt

def export_document_to_pdf(django_doc):
    """Export a Django Document model instance to PDF format."""

    # 1. Initialize markdown parser
    md = MarkdownIt("commonmark", {"linkify": False, "html": True}).enable("table")

    # 2. Create the HTML content
    html_content = f"<h1>{'AI Concept Note'}</h1>"

    # 3. Add document sections
    for sec in django_doc.sections.order_by("order"):
        md_content = sec.get_content() or ""
        # html_content += f"<h2>{sec.title}</h2>"
        html_content += md.render(md_content)

    # 4. Use xhtml2pdf to convert HTML to PDF
    result_file = io.BytesIO()
    pisa_status = pisa.CreatePDF(
            html_content,
            dest=result_file)

    # 5. Return the PDF file
    if not pisa_status.err:
        result_file.seek(0)
        return result_file
    else:
        raise Exception("PDF creation failed.")