import os
from typing import List

from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

from .config import FAISS_INDEX_DIR, OPENAI_API_KEY, GOOGLE_API_KEY

def get_embeddings():
    """
    Returns the embeddings model. Defaults to OpenAI if key exists.
    """
    if OPENAI_API_KEY:
        return OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
    elif GOOGLE_API_KEY:
        # Placeholder for Gemini if user sets GOOGLE_API_KEY instead
        raise NotImplementedError("Gemini embeddings not configured in this example yet.")
        
    raise ValueError("No valid API Key found for embeddings (OpenAI).")

def add_documents_to_index(documents: List[Document]):
    """
    Adds documents to the FAISS index. If an index already exists, loads it and appends.
    """
    embeddings = get_embeddings()
    index_file = os.path.join(FAISS_INDEX_DIR, "index.faiss")
    
    if os.path.exists(index_file):
        print("Loading existing FAISS index...")
        vectorstore = FAISS.load_local(
            FAISS_INDEX_DIR, 
            embeddings, 
            allow_dangerous_deserialization=True  # Required for FAISS locally
        )
        vectorstore.add_documents(documents)
    else:
        print("Creating new FAISS index...")
        vectorstore = FAISS.from_documents(documents, embeddings)
        
    vectorstore.save_local(FAISS_INDEX_DIR)
    print(f"Indexed {len(documents)} chunks to FAISS.")

def get_retriever():
    """
    Returns a retriever initialized from the FAISS index if it exists,
    otherwise returns None.
    """
    index_file = os.path.join(FAISS_INDEX_DIR, "index.faiss")
    if not os.path.exists(index_file):
        return None
        
    embeddings = get_embeddings()
    vectorstore = FAISS.load_local(
        FAISS_INDEX_DIR, 
        embeddings, 
        allow_dangerous_deserialization=True
    )
    return vectorstore.as_retriever(search_kwargs={"k": 5})
