from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import secrets
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

# Load environment variables from .env file if it exists (for local development)
load_dotenv()

import logging
import sys
logging.basicConfig(level=logging.INFO, stream=sys.stdout, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Initialize Firebase Admin globally once
if not firebase_admin._apps:
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
    
    if project_id and client_email and private_key:
        print("Firebase Admin initializing with Service Account from Env Vars.")
        # Replace escaped newlines with actual newlines, just like in the TS app
        formatted_private_key = private_key.replace('\\n', '\n')
        
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID", ""),
            "private_key": formatted_private_key,
            "client_email": client_email,
            "client_id": os.environ.get("FIREBASE_CLIENT_ID", ""),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email.replace('@', '%40')}"
        })
        firebase_admin.initialize_app(cred)
    else:
        print("Firebase Admin initializing with Default Credentials.")
        # Fallback for Cloud Run ADC or local gcloud auth
        firebase_admin.initialize_app()

from src.budget.application.use_cases.extract_budget_from_pdf import ExtractBudgetFromPdfUseCase
from src.extractor.infrastructure.adapters.pdfplumber_adapter import PdfPlumberAdapter
from src.budget.domain.exceptions import MathematicalValidationError

from src.budget.application.use_cases.restructure_budget_uc import RestructureBudgetUseCase
from src.core.http.dependencies import get_restructure_budget_uc

app = FastAPI(
    title="Express Renovation AI Core",
    description="Spatial PDF extraction and Gemini-powered budget pricing.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Spatial OCR Extractor DI
pdf_reader_adapter = PdfPlumberAdapter()
extract_use_case = ExtractBudgetFromPdfUseCase(pdf_reader=pdf_reader_adapter)

def require_service_token(x_service_token: str = Header(None)):
    """
    Shared-secret guard for the job endpoints.

    Cloud Run IAM is the stronger control, but the caller is a Next.js server
    action running on Vercel, which has no GCP metadata server to mint an
    identity token from. This keeps the endpoint from being an open, unmetered
    door to Gemini for anyone who finds the URL. `/health` stays open so
    uptime checks work.
    """
    expected = os.environ.get("SERVICE_TOKEN")
    if not expected:
        # Fail closed: an unset token in production would otherwise silently
        # disable the only protection this endpoint has.
        raise HTTPException(status_code=503, detail="SERVICE_TOKEN not configured")
    if not x_service_token or not secrets.compare_digest(x_service_token, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing service token")


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/jobs/measurements")
async def process_measurement_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    leadId: str = Form("anonymous"),
    budgetId: str = Form(None),
    restructure_uc: RestructureBudgetUseCase = Depends(get_restructure_budget_uc),
    _auth: None = Depends(require_service_token),
):
    """
    1. Spatial PDF Extraction (Synchronous)
    2. Spawns Background AI Job (Asynchronous) to prevent Vercel 60s timeout.
    Returns 202 Accepted.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # Wait, the current extract_use_case signature isn't passing text optimally to AI. 
        # But this assumes it fetches raw list of text tables dicts.
        raw_extraction_result = extract_use_case.execute(file.file)
        
        # The extractor returns {"status": "success", "extracted_text": list}
        # It's already parsed into an array by pdfplumber.
        full_list = raw_extraction_result.get("extracted_text", [])
        raw_items = full_list if isinstance(full_list, list) else [{"text": str(full_list)}]
        
        # Super important safeguard: if PdfPlumber failed to see tables and returned 
        # a single massive 100-page string, we must split it by paragraphs to avoid 
        # triggering Google HTTP Idle Timeouts.
        if len(raw_items) == 1 and isinstance(raw_items[0], dict) and "text" in raw_items[0]:
            massive_text = raw_items[0]["text"]
            # Split by double newline (paragraphs) to create pseudo-items
            split_texts = [p.strip() for p in massive_text.split("\n\n") if len(p.strip()) > 10]
            if len(split_texts) > 1:
                logger.info(f"Splitting massive monolith text into {len(split_texts)} paragraph chunks.")
                raw_items = [{"text": p} for p in split_texts]

        logger.info(f"HTTP Extract Received - Yielded {len(raw_items)} raw items. Spawning Background AI job...")

        # Phase 2: Send heavy lifting to background thread
        # The AI (15 RPM wait times, Firestore vector search) runs offline without blocking the HTTP request
        
        async def run_ai_job():
            try:
                await restructure_uc.execute(raw_items, leadId, budgetId)
                logger.info("Background AI Job Completed Successfully.")
            except Exception as e:
                logger.error(f"Background AI Job Failed: {e}")
                import traceback
                traceback.print_exc()
            
        background_tasks.add_task(run_ai_job)

        return JSONResponse(status_code=202, content={
            "status": "processing", 
            "message": "The AI Budgeting Agent has started pricing your PDF in the background.",
            "leadId": leadId
        })
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
