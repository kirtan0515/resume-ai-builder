import os
import numpy as np
import faiss
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
EMBED_MODEL = "text-embedding-3-small"


def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(model=EMBED_MODEL, input=text)
    return response.data[0].embedding


class RAGService:
    def chunk_text(self, text: str, chunk_size: int = 500) -> list[str]:
        text = text.strip()
        return [
            text[i:i + chunk_size].strip()
            for i in range(0, len(text), chunk_size)
            if text[i:i + chunk_size].strip()
        ]

    def retrieve_relevant_chunks(
        self, resume_text: str, job_description: str, top_k: int = 5
    ) -> list[str]:
        chunks = self.chunk_text(resume_text)
        if not chunks:
            return []

        # Embed all chunks
        chunk_embeddings = np.array(
            [get_embedding(chunk) for chunk in chunks], dtype="float32"
        )

        # Build FAISS index
        dim = chunk_embeddings.shape[1]
        index = faiss.IndexFlatL2(dim)
        index.add(chunk_embeddings)

        # Embed the job description as the query
        jd_embedding = np.array([get_embedding(job_description)], dtype="float32")

        _, indices = index.search(jd_embedding, min(top_k, len(chunks)))
        return [chunks[i] for i in indices[0] if 0 <= i < len(chunks)]
