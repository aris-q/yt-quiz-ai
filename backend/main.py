from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from supabase import create_client
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

class PrivateNetworkMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response

app.add_middleware(PrivateNetworkMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

class AttemptRequest(BaseModel):
    video_id: str
    score: int
    total: int
    user_email: str = None
    
class QuizRequest(BaseModel):
    video_id: str
    num_questions: int = 5
    difficulty: str = "medium"

@app.post("/quiz/generate")
async def generate_quiz(req: QuizRequest):
    # Check cache first
    cached = supabase.table("quizzes").select("*").eq("video_id", req.video_id).execute()
    if cached.data:
        return {"video_id": req.video_id, "questions": cached.data[0]["questions"]}

    try:
        ytt = YouTubeTranscriptApi()
        transcript_list = ytt.fetch(req.video_id, languages=['en'])
        transcript = " ".join([t.text for t in transcript_list])
        transcript = transcript[:12000]
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Transcript error: {str(e)}")

    prompt = f"""You are a quiz generator. Given the following video transcript, generate {req.num_questions} multiple choice questions at {req.difficulty} difficulty.

Transcript:
{transcript}

Respond ONLY with a JSON array, no markdown, no explanation. Format:
[
  {{
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation of the correct answer"
  }}
]
answer is the index (0-3) of the correct option."""

    response = model.generate_content(prompt)
    raw = response.text.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        questions = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

    # Cache questions in Supabase
    supabase.table("quizzes").insert({"video_id": req.video_id, "questions": questions}).execute()

    return {"video_id": req.video_id, "questions": questions}

@app.post("/quiz/attempt")
async def save_attempt(req: AttemptRequest):
    supabase.table("attempts").insert({
        "video_id": req.video_id,
        "score": req.score,
        "total": req.total,
        "user_email": req.user_email
    }).execute()
    return {"status": "saved"}

@app.get("/quiz/history/{video_id}")
async def get_history(video_id: str):
    result = supabase.table("attempts").select("*").eq("video_id", video_id).order("created_at", desc=True).execute()
    return {"attempts": result.data}

@app.get("/health")
async def health():
    return {"status": "ok"}