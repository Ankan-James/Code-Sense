"""
CodeSense v2 — Flask Backend
Serves the frontend and exposes API routes for code analysis, explanation, chat, and report download.
"""

import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from agent import analyze_code, explain_segment, chat_reply
from tools import generate_pdf_report, generate_docx_report

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)


# ─── Serve Frontend ────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main HTML page."""
    return send_from_directory("static", "index.html")


# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Receives a code file and personality, returns parsed segments.
    Expects multipart form data with 'file' and 'personality' fields.
    """
    try:
        # Get the uploaded file
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        personality = request.form.get("personality", "Friendly tutor")
        filename = file.filename or "unknown.py"

        # Read file content
        code = file.read().decode("utf-8")

        if not code.strip():
            return jsonify({"error": "File is empty"}), 400

        # Parse code into segments
        segments = analyze_code(code, personality, filename)

        return jsonify({
            "segments": segments,
            "filename": filename,
            "code": code
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/explain", methods=["POST"])
def explain():
    """
    Receives a segment and returns an AI-generated explanation.
    Expects JSON with segment_code, segment_name, segment_type, and personality.
    """
    try:
        data = request.get_json()

        segment_code = data.get("segment_code", "")
        segment_name = data.get("segment_name", "")
        segment_type = data.get("segment_type", "")
        personality = data.get("personality", "Friendly tutor")

        if not segment_code:
            return jsonify({"error": "No segment code provided"}), 400

        explanation = explain_segment(segment_code, segment_name, segment_type, personality)

        return jsonify({"explanation": explanation})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/chat", methods=["POST"])
def chat():
    """
    Handles follow-up chat messages within a segment chatbox.
    Expects JSON with message, segment_code, history, and personality.
    """
    try:
        data = request.get_json()

        message = data.get("message", "")
        segment_code = data.get("segment_code", "")
        history = data.get("history", [])
        personality = data.get("personality", "Friendly tutor")

        if not message:
            return jsonify({"error": "No message provided"}), 400

        reply = chat_reply(message, segment_code, history, personality)

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/download", methods=["POST"])
def download():
    """
    Generates and returns a PDF or DOCX report of all explanations.
    Expects JSON with segments (with explanations), personality, filename, and format.
    """
    try:
        data = request.get_json()

        segments = data.get("segments", [])
        personality = data.get("personality", "")
        filename = data.get("filename", "code")
        file_format = data.get("format", "pdf")

        if not segments:
            return jsonify({"error": "No segments provided"}), 400

        # Generate report
        if file_format == "docx":
            report_path = generate_docx_report(segments, personality, filename)
            mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            download_name = f"CodeSense_Report_{filename}.docx"
        else:
            report_path = generate_pdf_report(segments, personality, filename)
            mimetype = "application/pdf"
            download_name = f"CodeSense_Report_{filename}.pdf"

        return send_file(
            report_path,
            mimetype=mimetype,
            as_attachment=True,
            download_name=download_name
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Run Server ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Create static directory if it doesn't exist
    os.makedirs("static", exist_ok=True)
    app.run(debug=True, port=5000)