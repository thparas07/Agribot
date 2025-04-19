from flask import Flask, render_template, jsonify, request
from src.helper import download_hugging_face_embeddings
from langchain_pinecone import PineconeVectorStore
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from src.prompt import *
import google.generativeai as genai
import os

app = Flask(__name__)


# Load environment variables
load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GEMINI_API_KEY = os.getenv("google_api_key")

# Set API keys
os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY
genai.configure(api_key=GEMINI_API_KEY)

# Load embeddings
embeddings = download_hugging_face_embeddings()

# Pinecone vector store
index_name = "farmerbot"
docsearch = PineconeVectorStore.from_existing_index(
    index_name=index_name,
    embedding=embeddings
)
retriever = docsearch.as_retriever(search_type="similarity", search_kwargs={"k": 3})

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_prompt),
        ("human", "{input}"),
    ]
)

# Gemini model setup
def query_gemini(input_text):
    # List of agriculture-related keywords (you can expand this list)
    agriculture_keywords = [
        "crop", "farming", "soil", "irrigation", "pesticide", "fertilizer",
        "harvest", "weather", "agriculture", "yield", "seeds", "greenhouse",
        "organic", "pest control", "disease", "farmer", "livestock", "drought","weather","grow","pen","sugarcane",""
    ]

    # Convert input to lowercase for case-insensitive matching
    input_lower = input_text.lower()

    # Check if at least one agriculture-related keyword is present
    if not any(keyword in input_lower for keyword in agriculture_keywords):
        return "Sorry, I can only answer questions related to agriculture."

    # Proceed with Gemini API if input is valid
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(input_text)
    return response.text if response else "Sorry, I couldn't process that request."


# Retrieval-Augmented Generation (RAG) Chain
def generate_response(user_input):
    return query_gemini(user_input)

# Routes
@app.route("/")
def index():
    return render_template('chat.html')

@app.route("/get", methods=["GET", "POST"])
def chat():
    msg = request.form["msg"]
    print("User:", msg)
    response = generate_response(msg)
    print("Response:", response)
    return str(response)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)