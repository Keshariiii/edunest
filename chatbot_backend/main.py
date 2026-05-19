import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from models import ChatRequest, ChatResponse
from core.config import UPLOAD_DIR
from core.pdf_processor import process_pdf
from core.vector_store import add_documents_to_index
from core.agent import get_answer

app = FastAPI(title="AI Chatbot Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """
    Upload one or multiple PDFs. Extracts text, creates embeddings, and stores in FAISS.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    all_chunks = []
    saved_files = []

    try:
        for file in files:
            if not file.filename.endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF. Skipping.")
                continue
            
            # Save file locally
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            saved_files.append(file.filename)
            
            # Process PDF
            chunks = process_pdf(file_path)
            all_chunks.extend(chunks)

        if all_chunks:
            add_documents_to_index(all_chunks)

        return {
            "message": f"Successfully processed and indexed {len(saved_files)} files.",
            "files": saved_files,
            "chunks_indexed": len(all_chunks)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Ask a question. Uses the conversational agent (PDF Search + Web Search fallback).
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    try:
        answer = get_answer(request.session_id, request.question)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Chatbot Backend. Post to /upload or /chat."}
