from src.helper import load_pdf_file, text_split
from langchain_huggingface import HuggingFaceEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get API key from environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

if not PINECONE_API_KEY:
    raise ValueError("❌ PINECONE_API_KEY is missing. Check your .env file!")

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)

# Define index name
index_name = "farmerbot18"

# Check if index exists before creating it
if index_name not in [index["name"] for index in pc.list_indexes()]:
    print("🟢 Creating new Pinecone index...")
    pc.create_index(
        name=index_name,
        dimension=384,  # Ensure it matches your embedding model
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
else:
    print("✅ Index already exists. Skipping creation.")

# Load and process PDF data
extracted_data = load_pdf_file(data="Data/")
text_chunks = text_split(extracted_data)

# ✅ Ensure text_chunks are strings, not Document objects
if isinstance(text_chunks[0], Document):
    text_chunks = [chunk.page_content for chunk in text_chunks]

# ✅ Define `documents` properly before use
documents = [
    Document(page_content=chunk, metadata={"text": chunk}) for chunk in text_chunks
]

# Download embeddings model
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

# ✅ Upload documents to Pinecone
print("🔄 Uploading documents to Pinecone...")
docsearch = PineconeVectorStore.from_documents(
    documents=documents,  # Now properly defined
    index_name=index_name,
    embedding=embeddings,
)

print("✅ Pinecone vector store setup completed!")
