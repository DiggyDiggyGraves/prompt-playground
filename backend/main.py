from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import ollama
from pydantic import BaseModel
import sqlite3
from database import init_db, DB_NAME

app = FastAPI(title="PromptPlayground Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

class PromptRequest(BaseModel):
    model: str
    prompt: str
    system: str | None = None
    temperature: float = 0.7

class TemplateCreate(BaseModel):
    title: str
    system_prompt: str
    user_prompt: str

@app.get("/api/models")
def get_models():
    """Fetch available models from the local Ollama instance using the SDK."""
    try:
        response = ollama.list()
        # Format list to match what the frontend expects ({ "models": [...] })
        return {"models": [{"name": m.get("model") or m.get("name")} for m in response.get("models", [])]}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama connection failed: {str(e)}")

@app.post("/api/generate")
def generate_response(req: PromptRequest):
    """Forward prompt request using the official Ollama Python SDK."""
    try:
        full_prompt = req.prompt
        if req.system:
            full_prompt = f"System: {req.system}\n\nUser: {req.prompt}"

        # Official SDK call handles timeouts and streaming cleanly
        response = ollama.generate(
            model=req.model,
            prompt=full_prompt,
            options={"temperature": req.temperature}
        )
        
        # Normalize response structure back to what frontend expects
        return {
            "response": response.get("response", ""),
            "model": req.model,
            "done": response.get("done", True)
        }
            
    except Exception as e:
        error_detail = f"{type(e).__name__}: {str(e)}"
        print(f"Detailed generation error: {error_detail}")
        raise HTTPException(status_code=503, detail=f"Generation failed: {error_detail}")

@app.get("/api/templates")
def get_templates():
    """Retrieve saved prompt templates from SQLite."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM templates ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/api/templates")
def create_template(template: TemplateCreate):
    """Save a new prompt template to SQLite."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO templates (title, system_prompt, user_prompt) VALUES (?, ?, ?)",
        (template.title, template.system_prompt, template.user_prompt)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "status": "created"}
