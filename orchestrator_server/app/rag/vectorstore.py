from __future__ import annotations
import shutil
import uuid
from pathlib import Path
from typing import Any, Dict

from fastapi import UploadFile
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

from ..config import settings


def _get_collection_name(document_set_id: str) -> str:
    return f"lectureai_{document_set_id}"


def get_vectorstore(document_set_id: str) -> Chroma:
    """Create or load a Chroma collection for a given document set."""
    embeddings = OllamaEmbeddings(
        model=settings.embedding_model_name,
        base_url=settings.ollama_base_url,
    )
    collection_name = _get_collection_name(document_set_id)
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=str(settings.chroma_db_dir),
    )
    return vectorstore


async def ingest_pdf(file: UploadFile, document_set_id: str | None = None) -> Dict[str, Any]:
    """Save an uploaded PDF, chunk it, and index into Chroma."""
    if document_set_id is None:
        document_set_id = str(uuid.uuid4())

    uploads_dir: Path = settings.uploads_dir / document_set_id
    uploads_dir.mkdir(parents=True, exist_ok=True)

    file_path = uploads_dir / file.filename
    with file_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    loader = PyPDFLoader(str(file_path))
    pages = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
    )
    chunks = splitter.split_documents(pages)

    for idx, doc in enumerate(chunks):
        meta = doc.metadata or {}
        meta.setdefault("source_file", file.filename)
        meta.setdefault("document_set_id", document_set_id)
        meta["chunk_index"] = idx
        doc.metadata = meta

    vectorstore = get_vectorstore(document_set_id)
    vectorstore.add_documents(chunks)
    vectorstore.persist()

    return {
        "document_set_id": document_set_id,
        "num_pages": len(pages),
        "num_chunks": len(chunks),
    }


def retrieve_passages(document_set_id: str, query: str, k: int = 6):
    """Retrieve top-k passages for a query from the vector store."""
    vectorstore = get_vectorstore(document_set_id)
    return vectorstore.similarity_search(query, k=k)

def retrieve_passages_for_course(course_id: str, topic: str, k: int = 6):
    """Retrieves passages across all materials for a specific course."""
    vectorstore = get_vectorstore(course_id)
    return vectorstore.similarity_search(
        query=topic,
        k=k,
        filter={"course_id": course_id} 
    )

