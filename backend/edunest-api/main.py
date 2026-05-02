import os
import json
import base64
import asyncio
import traceback
import httpx
from io import BytesIO
from typing import List, Any, Optional
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Optional: docx/pptx support
try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("WARNING: python-docx not installed. .docx uploads will be rejected.")

try:
    from pptx import Presentation as PptxPresentation
    PPTX_AVAILABLE = True
except ImportError:
    PPTX_AVAILABLE = False
    print("WARNING: python-pptx not installed. .pptx uploads will be rejected.")

# Initialize FastAPI app for EduNest
app = FastAPI()

# Enable CORS for local & network development (phone, LAN devices, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fix Swagger UI file upload: patch openapi schema to use format: binary
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
    for path_data in schema.get("paths", {}).values():
        for operation in path_data.values():
            body = operation.get("requestBody", {})
            content = body.get("content", {})
            form = content.get("multipart/form-data", {})
            schema_ref = form.get("schema", {})
            ref = schema_ref.get("$ref", "")
            if ref:
                def_name = ref.split("/")[-1]
                body_schema = schema.get("components", {}).get("schemas", {}).get(def_name, {})
                props = body_schema.get("properties", {})
                if "files" in props and props["files"].get("type") == "array":
                    props["files"]["items"] = {"type": "string", "format": "binary"}
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi

# API key is loaded dynamically on every request so swapping the key in .env
# takes effect immediately — no server restart required.
try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore

def get_api_key() -> str:
    """Re-reads GEMINI_API_KEY from .env on every call so key changes are instant."""
    if load_dotenv is not None:
        from pathlib import Path
        env_path = Path(__file__).parent / ".env"
        load_dotenv(dotenv_path=env_path, override=True)
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("No API key found. Please set GEMINI_API_KEY in your .env file.")
    return key

GEMINI_MODEL = "gemini-2.5-flash-lite"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# ─────────────────────────────────────────────────────────────────────────────
# Core helper: calls Gemini REST API directly with a 5-minute timeout.
# This completely bypasses the google-genai SDK which has a known bug where
# httpx timeouts are silently ignored in async mode.
# ─────────────────────────────────────────────────────────────────────────────
async def call_gemini(parts: list, generation_config: dict) -> str:
    """
    Calls the Gemini REST API directly via httpx with a 5-minute timeout.
    Re-reads the API key from .env on every call — swap the key anytime without restart.
    Auto-retries on 503 (server overloaded) and 429 (rate limit) with backoff.
    """
    api_key = get_api_key()  # ← fresh key read on every request
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": generation_config,
    }

    max_attempts = 3
    for attempt in range(max_attempts):
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                json=payload,
            )

        if response.status_code == 503:
            wait = 10  # fixed 10s wait — exponential was burning the frontend's 2-min budget
            print(f"503 overloaded — retrying in {wait}s (attempt {attempt+1}/{max_attempts})...")
            if attempt < max_attempts - 1:
                await asyncio.sleep(wait)
                continue
            else:
                response.raise_for_status()

        # REMOVED 429 retries. Fail fast if quota is exceeded.
        response.raise_for_status()
        break

    result = response.json()
    try:
        text = result["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise RuntimeError(f"Unexpected Gemini response format: {result}") from e
    return text


def parse_json_response(raw: str) -> dict:
    """Strips optional markdown fences and parses JSON."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}")
        # Return a safe fallback if Gemini outputs invalid JSON (like unescaped LaTeX)
        return {
            "formulas": [],
            "short_notes": ["Analysis completed, but the AI response contained invalid formatting.", text.strip()],
            "flashcards": []
        }


import io
from PIL import Image

def extract_text_from_docx(data: bytes) -> str:
    """Extract plain text from a .docx file."""
    try:
        doc = DocxDocument(BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise RuntimeError(f"Failed to parse .docx: {e}")

def extract_text_from_pptx(data: bytes) -> str:
    """Extract plain text from a .pptx file."""
    try:
        prs = PptxPresentation(BytesIO(data))
        texts = []
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    texts.append(shape.text)
        return "\n".join(texts)
    except Exception as e:
        raise RuntimeError(f"Failed to parse .pptx: {e}")


def encode_file(data: bytes, mime_type: str) -> dict:
    """Encodes raw file bytes as a Gemini inlineData part, compressing images to prevent hanging payloads."""
    if mime_type.startswith("image/"):
        try:
            img = Image.open(io.BytesIO(data))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            # Downscale large screenshots to max 1024x1024
            img.thumbnail((1024, 1024))
            
            # Save as compressed JPEG
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=70)
            data = output.getvalue()
            mime_type = "image/jpeg"
        except Exception as e:
            print(f"Warning: Failed to compress image: {e}")

    return {
        "inlineData": {
            "mimeType": mime_type,
            "data": base64.b64encode(data).decode("utf-8"),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/generate-study-material
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/generate-study-material")
async def generate_study_material(
    files: List[UploadFile] = File(...),
    subject: str = Form(...),
):
    try:
        # Build file parts (inline base64), with text extraction for office formats
        file_parts = []
        for file in files:
            file_data = await file.read()
            fname = (file.filename or "").lower()
            ct = file.content_type or ""
            if fname.endswith(".docx") or ct == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                if not DOCX_AVAILABLE:
                    raise HTTPException(status_code=400, detail="python-docx not installed on server.")
                extracted = extract_text_from_docx(file_data)
                file_parts.append({"text": f"[DOCUMENT CONTENT]:\n{extracted}"})
            elif fname.endswith(".pptx") or ct == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                if not PPTX_AVAILABLE:
                    raise HTTPException(status_code=400, detail="python-pptx not installed on server.")
                extracted = extract_text_from_pptx(file_data)
                file_parts.append({"text": f"[SLIDE CONTENT]:\n{extracted}"})
            else:
                file_parts.append(encode_file(file_data, ct or "application/octet-stream"))

        prompt_text = f"""
        ACT AS AN EXPERT TUTOR FOR {subject.upper()}.
        ANALYZE THE PROVIDED DOCUMENT TEXT AND/OR IMAGES AND EXTRACT HIGH-YIELD STUDY MATERIAL.

        CRITICAL INSTRUCTION: Aggressively identify any mathematical relationships, equations, or theorems to populate the Formulas tab, even if they aren't written in standard LaTeX format.

        !!! CRITICAL JSON RULE !!!
        You MUST double-escape all backslashes in your LaTeX (e.g., use \\\\frac instead of \\frac, \\\\sum instead of \\sum). This is strictly required for valid JSON.

        TASK & STRICT LIMITS:
        0. Metadata: Identify the chapter/topic name from this document. List the 3-6 key topics covered.
        1. Formulas: Extract the 5 to 10 most important mathematical/scientific formulas from this document. Convert to LaTeX.
        2. Short Notes: Generate 5 to 10 highly condensed, core conceptual points from this document.
           Return clean, plain text strings for short_notes. DO NOT start strings with dashes (-), bullet points, or asterisks (*).
        3. Flashcards: Create exactly 5 to 10 active-recall flashcards covering high-yield definitions and concepts.
           !!! MATH IN FLASHCARDS RULE !!!
           - ALL mathematical expressions, equations, variables, and symbols MUST be wrapped in LaTeX inline delimiters: $...$
           - Example: write "$x^3 - 6x + 11x - 6$" NOT "x^3 - 6x + 11x - 6"
           - Example: write "$a^m \\times a^n = a^{m+n}$" NOT "a^m \times a^n = a^{m+n}"
           - Double-escape ALL backslashes inside $...$: use \\\\frac, \\\\sqrt, \\\\times, \\\\sum, etc.
           - Plain text parts of the flashcard (non-math) should remain as normal text.

        FORMAT EXACTLY AS THIS JSON STRUCTURE:
        {{
          "metadata": {{ "chapter_title": "string", "topics_covered": ["topic1", "topic2"] }},
          "formulas": [{{ "name": "string", "equation": "latex_string" }}],
          "short_notes": ["clean string without bullet characters"],
          "flashcards": [{{ "front": "string", "back": "string" }}]
        }}
        """

        parts = [{"text": prompt_text}] + file_parts

        generation_config = {
            "responseMimeType": "application/json",
            "temperature": 0.3,
        }

        max_retries = 3
        raw_response = None
        for attempt in range(max_retries):
            try:
                print(f"Study material attempt {attempt + 1}/{max_retries}...")
                raw_response = await call_gemini(parts, generation_config)
                break
            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                body = e.response.text
                print(f"Gemini API error {status}: {body}")
                raise RuntimeError(f"Gemini API returned {status}: {body}") from e
            except httpx.TimeoutException as e:
                print(f"Timeout on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                else:
                    raise RuntimeError("Gemini API timed out after 5 minutes. Please try a smaller file.") from e

        data = parse_json_response(raw_response)
        return {
            "metadata":    data.get("metadata", {"chapter_title": "", "topics_covered": []}),
            "formulas":    data.get("formulas", []),
            "short_notes": data.get("short_notes", []),
            "flashcards":  data.get("flashcards", []),
        }

    except Exception as e:
        traceback.print_exc()
        print(f"STUDY MATERIAL ERROR: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "message": "Failed to process the document. Try a clearer photo or PDF.",
                "details": str(e),
            },
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/generate-quiz
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/api/generate-quiz")
async def generate_quiz(
    files: List[UploadFile] = File(...),
    subject: str = Form(...),
    exam_type: str = Form(default="JEE Main"),
    difficulty: str = Form(default="Medium"),
    num_questions: int = Form(default=10),
):
    try:
        # Encode files once
        file_parts = []
        for file in files:
            file_data = await file.read()
            file_parts.append(encode_file(file_data, file.content_type))

        batch_size = 3
        all_mcqs: List[dict[str, Any]] = []

        batches = [batch_size] * (num_questions // batch_size)
        if num_questions % batch_size != 0:
            batches.append(num_questions % batch_size)

        generation_config = {
            "responseMimeType": "application/json",
            "temperature": 0.4,
        }

        for i, num_in_batch in enumerate(batches):
            print(f"--- BATCH {i+1}/{len(batches)} ({num_in_batch} questions) ---")

            prompt_text = f"""
            Based on the provided notes, create exactly {num_in_batch} {exam_type} quiz questions for {subject}.
            Difficulty level: {difficulty}.

            !!! CRITICAL MATH FORMATTING RULE !!!
            Ensure all mathematical symbols, Greek letters, and units (like Omega) are enclosed in single dollar signs for inline math (e.g., $5 \\Omega$) or double dollar signs for block equations.
            BAD: Calculate mole fraction (x) using Henry's Law (p = K_H * x)
            GOOD: Calculate mole fraction ($x$) using Henry's Law ($p = K_H \\cdot x$)

            Whenever you output a Greek letter (such as \\alpha, \\beta, \\gamma, \\Delta, \\Omega, \\varepsilon, etc.), you MUST wrap it in a LaTeX textcolor command using the exact hex code #ff453a.
            BAD: Calculate the resistance using $R = \\rho \\frac{{L}}{{A}}$ and $\\Omega$
            GOOD: Calculate the resistance using $R = \\textcolor{{#ff453a}}{{\\rho}} \\frac{{L}}{{A}}$ and $\\textcolor{{#ff453a}}{{\\Omega}}$

            DO NOT repeat these specific concepts: {[q.get('question', '')[:50] for q in all_mcqs]}
            Keep explanations concise (maximum 4 steps).

            Return ONLY this JSON structure:
            {{ "mcqs": [{{
                "question": "string containing $math$",
                "options": ["string containing $math$"],
                "correct_indices": [int],
                "explanation": "string containing $math$",
                "type": "mcq"
            }}] }}
            """

            parts = [{"text": prompt_text}] + file_parts
            batch_success = False

            for attempt in range(3):
                raw_response = None
                try:
                    print(f"  Attempt {attempt + 1}/3...")
                    raw_response = await call_gemini(parts, generation_config)
                    batch_data = parse_json_response(raw_response)
                    if "mcqs" in batch_data:
                        all_mcqs.extend(batch_data["mcqs"])
                        print(f"  Added {len(batch_data['mcqs'])} questions.")
                        batch_success = True
                        break
                except httpx.HTTPStatusError as e:
                    status = e.response.status_code
                    print(f"  Batch {i+1} API error {status} on attempt {attempt+1}")
                    if status == 429 and attempt < 2:
                        await asyncio.sleep(30)
                    else:
                        print(f"  Batch {i+1} failed.")
                except Exception as batch_err:
                    print(f"  Batch {i+1} error on attempt {attempt+1}: {batch_err}")
                    if raw_response:
                        print(f"  Raw: {raw_response[:300]}")
                    if attempt < 2:
                        await asyncio.sleep(15)

            if not batch_success:
                print(f"Stopping — batch {i+1} failed all retries.")
                break

            if (i < len(batches) - 1):
                print(f"Sleeping 5s between batches...")
                await asyncio.sleep(5)

        if len(all_mcqs) == 0:
            raise HTTPException(
                status_code=422,
                detail="The AI could not extract readable text from this document. Please try a clearer PDF.",
            )

        return {"mcqs": all_mcqs[:num_questions]}

    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        print(f"QUIZ SETUP ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/evaluate-quiz
# ─────────────────────────────────────────────────────────────────────────────
class QuestionEvaluationItem(BaseModel):
    correct_indices: List[int]
    selected_indices: Optional[List[int]] = None

class QuizEvaluationRequest(BaseModel):
    questions: List[QuestionEvaluationItem]

@app.post("/api/evaluate-quiz")
async def evaluate_quiz(request: QuizEvaluationRequest):
    total_score = 0
    max_possible_score = 0
    individual_evaluations = []

    for q in request.questions:
        max_possible_score += 1
        if not q.selected_indices:
            marks_awarded = 0
            is_correct = None
        else:
            is_correct = sorted(q.selected_indices) == sorted(q.correct_indices)
            marks_awarded = 1 if is_correct else 0

        total_score += marks_awarded
        individual_evaluations.append({
            "is_correct": is_correct,
            "marks_awarded": marks_awarded,
            "correct_indices": q.correct_indices,
            "selected_indices": q.selected_indices if q.selected_indices else [],
        })

    return {
        "total_score": total_score,
        "max_possible_score": max_possible_score,
        "evaluations": individual_evaluations,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, timeout_keep_alive=300)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/regenerate-section
# Regenerates ONLY one section (formulas | short_notes | flashcards) from the
# same uploaded files. Uses a smaller, targeted prompt to save API quota.
# ─────────────────────────────────────────────────────────────────────────────
SECTION_PROMPTS = {
    "formulas": """
        ACT AS AN EXPERT {subject} TUTOR.
        From the provided document, extract the 5 to 10 most important mathematical/scientific formulas.
        Double-escape ALL LaTeX backslashes (e.g. \\\\frac, \\\\sum).
        Return ONLY this JSON: {{ "formulas": [{{ "name": "string", "equation": "latex_string" }}] }}
    """,
    "notes": """
        ACT AS AN EXPERT {subject} TUTOR.
        From the provided document, generate 5 to 10 highly condensed, high-yield conceptual notes.
        Return clean plain text strings. DO NOT start with dashes, bullets, or asterisks.
        Return ONLY this JSON: {{ "short_notes": ["note text"] }}
    """,
    "flashcards": """
        ACT AS AN EXPERT {subject} TUTOR.
        From the provided document, create 5 to 10 active-recall flashcards for high-yield definitions and concepts.

        !!! MATH IN FLASHCARDS RULE !!!
        - ALL mathematical expressions, equations, variables, and symbols MUST be wrapped in LaTeX inline delimiters: $...$
        - Example: write "$x^3 - 6x + 11x - 6$" NOT "x^3 - 6x + 11x - 6"
        - Example: write "$(a+b)^2 = a^2 + b^2 + 2ab$" NOT "(a+b)^2 = a^2 + b^2 + 2ab"
        - Double-escape ALL backslashes inside $...$: \\\\frac, \\\\sqrt, \\\\times, \\\\sum, etc.
        - Plain text parts remain as normal text. Only math gets $...$.

        Return ONLY this JSON: {{ "flashcards": [{{ "front": "string", "back": "string" }}] }}
    """,
}

@app.post("/api/regenerate-section")
async def regenerate_section(
    files: List[UploadFile] = File(...),
    subject: str = Form(...),
    section_type: str = Form(...),   # "formulas" | "notes" | "flashcards"
):
    if section_type not in SECTION_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown section_type '{section_type}'. Must be: formulas, notes, flashcards.")

    try:
        file_parts = []
        for file in files:
            file_data = await file.read()
            fname = (file.filename or "").lower()
            ct = file.content_type or ""
            if fname.endswith(".docx") or ct == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                if not DOCX_AVAILABLE:
                    raise HTTPException(status_code=400, detail="python-docx not installed.")
                extracted = extract_text_from_docx(file_data)
                file_parts.append({"text": f"[DOCUMENT CONTENT]:\n{extracted}"})
            elif fname.endswith(".pptx") or ct == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                if not PPTX_AVAILABLE:
                    raise HTTPException(status_code=400, detail="python-pptx not installed.")
                extracted = extract_text_from_pptx(file_data)
                file_parts.append({"text": f"[SLIDE CONTENT]:\n{extracted}"})
            else:
                file_parts.append(encode_file(file_data, ct or "application/octet-stream"))

        prompt_text = SECTION_PROMPTS[section_type].format(subject=subject.upper())
        parts = [{"text": prompt_text}] + file_parts

        generation_config = {"responseMimeType": "application/json", "temperature": 0.4}

        raw_response = await call_gemini(parts, generation_config)
        data = parse_json_response(raw_response)

        # Return only the requested section
        if section_type == "formulas":
            return {"section": "formulas", "data": data.get("formulas", [])}
        elif section_type == "notes":
            return {"section": "notes", "data": data.get("short_notes", [])}
        elif section_type == "flashcards":
            return {"section": "flashcards", "data": data.get("flashcards", [])}

    except HTTPException as he:
        raise he
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Regeneration error: {str(e)}")