import csv, io, os, xlsxwriter
from django.conf import settings
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch




def get_filename(ext):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    folder = os.path.join(settings.MEDIA_ROOT, "reports")
    os.makedirs(folder, exist_ok=True)
    filename = f"members_{timestamp}.{ext}"
    filepath = os.path.join(folder, filename)
    return filepath, filename


def generate_csv_response(queryset, fields):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(fields)

    for obj in queryset:
        writer.writerow([getattr(obj, field, "") for field in fields])

    buffer.seek(0)
    byte_buffer = io.BytesIO(buffer.getvalue().encode('utf-8'))
    path, filename = get_filename("csv")
    with open(path, "wb") as f:
        f.write(byte_buffer.getvalue())

    return byte_buffer, filename


def generate_excel_response(queryset, fields):
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    sheet = workbook.add_worksheet()

    for i, field in enumerate(fields):
        sheet.write(0, i, field)

    for r, obj in enumerate(queryset, start=1):
        for c, field in enumerate(fields):
            sheet.write(r, c, str(getattr(obj, field, "")))

    workbook.close()
    output.seek(0)
    path, filename = get_filename("xlsx")
    with open(path, "wb") as f:
        f.write(output.getvalue())

    return output, filename


def generate_pdf_response(queryset, fields):
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    x_start = inch
    y = height - inch
    line_height = 14
    section_spacing = 10

    for index, obj in enumerate(queryset, start=1):
        p.setFont("Helvetica-Bold", 12)
        p.drawString(x_start, y, f"Member {index}")
        y -= line_height

        p.setFont("Helvetica", 10)
        for field in fields:
            label = field.replace('_', ' ').capitalize()
            value = str(getattr(obj, field, ''))
            p.drawString(x_start, y, f"{label}: {value}")
            y -= line_height

            if y < inch:
                p.showPage()
                y = height - inch

        y -= section_spacing
        if y < inch:
            p.showPage()
            y = height - inch

    p.save()
    buffer.seek(0)
    
    path, filename = get_filename("pdf")
    with open(path, "wb") as f:
        f.write(buffer.getvalue())
    
