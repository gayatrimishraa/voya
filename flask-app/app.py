from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from routes.itinerary import itinerary_bp
from routes.chat import chat_bp
import io
import json


def create_app():
    app = Flask(__name__)
    CORS(app, origins=[
        "http://localhost:3000",
        "http://localhost:5001",
        "https://*.vercel.app",
    ])

    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["100 per minute"],
        storage_uri="memory://",
    )

    # Apply stricter limit to chat endpoint
    @limiter.limit("30 per minute")
    @app.before_request
    def _rate_limit_chat():
        from flask import request
        if request.path == "/api/chat" and request.method == "POST":
            pass  # limiter decorator handles it

    # Test MongoDB connection on startup
    try:
        from db.mongo import get_db
        db = get_db()
        print("[OK] MongoDB connected -- database: voya")
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        print("   Set MONGO_URI in your .env file")
        print("   Server will still start -- DB routes will return 503")

    app.register_blueprint(itinerary_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return jsonify({"status": "Voya AI server running ✅", "version": "2.0"})

    @app.route("/health")
    def health():
        try:
            from db.mongo import get_db
            get_db()
            db_status = "connected"
        except Exception:
            db_status = "disconnected"
        return jsonify({"status": "ok", "db": db_status})

    @app.route("/api/itinerary/<itinerary_id>/pdf")
    def export_pdf(itinerary_id):
        """Export an itinerary as a PDF."""
        try:
            from db.mongo import get_itinerary
            doc = get_itinerary(itinerary_id)
            if not doc:
                return jsonify({"success": False, "error": "Not found"}), 404

            itinerary = doc.get("data", doc)
            pdf_buffer = _generate_pdf(itinerary)
            return send_file(
                pdf_buffer,
                mimetype="application/pdf",
                as_attachment=True,
                download_name=f"voya-itinerary-{itinerary_id[:8]}.pdf",
            )
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    return app


def _generate_pdf(itinerary: dict) -> io.BytesIO:
    """Generate a PDF from itinerary data using reportlab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("VoyaTitle", parent=styles["Title"], fontSize=22, textColor=colors.HexColor("#1a1a1a"))
    heading_style = ParagraphStyle("VoyaH2", parent=styles["Heading2"], fontSize=14, textColor=colors.HexColor("#C9A55A"), spaceAfter=8)
    body_style = styles["Normal"]

    elements = []

    # Title
    elements.append(Paragraph(f"✦ {itinerary.get('title', 'Voya Itinerary')}", title_style))
    elements.append(Spacer(1, 6))
    dest = itinerary.get("destination", "")
    dur = itinerary.get("duration", "")
    elements.append(Paragraph(f"{dest} · {dur} days", body_style))
    elements.append(Spacer(1, 18))

    # Budget breakdown
    budget = itinerary.get("budgetBreakdown", {})
    if budget:
        elements.append(Paragraph("Budget Breakdown", heading_style))
        for key, val in budget.items():
            elements.append(Paragraph(f"• {key.replace('_', ' ').title()}: {val}", body_style))
        elements.append(Spacer(1, 12))

    # Days
    days = itinerary.get("days", [])
    for day in days:
        if not isinstance(day, dict):
            continue
        day_num = day.get("day", "?")
        day_title = day.get("title", f"Day {day_num}")
        elements.append(Paragraph(f"Day {day_num}: {day_title}", heading_style))

        for period in ["morning", "afternoon", "evening"]:
            slot = day.get(period, {})
            if isinstance(slot, dict) and slot.get("activity"):
                act = slot["activity"]
                desc = slot.get("description", "")
                cost = slot.get("cost", "")
                elements.append(Paragraph(f"<b>{period.title()}:</b> {act} — {desc} ({cost})", body_style))

        elements.append(Spacer(1, 10))

    # Booking links
    links = itinerary.get("bookingLinks", {})
    if links:
        elements.append(Paragraph("Booking Links", heading_style))
        for label, url in links.items():
            elements.append(Paragraph(f"• {label}: {url}", body_style))

    # Packing list
    packing = itinerary.get("packingList", [])
    if packing:
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Packing List", heading_style))
        for item in packing:
            elements.append(Paragraph(f"□ {item}", body_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5001)