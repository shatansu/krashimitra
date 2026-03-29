from __future__ import annotations

import base64
import uuid
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.core import KrishiAgent
from audit.logger import AuditLogger
from compliance.engine import ComplianceEngine


class TextQueryRequest(BaseModel):
    query: str
    language: str = "hi"
    location: str | None = None
    soil_data: dict[str, Any] | None = None
    crop_type: str | None = None
    session_id: str | None = None


class AdvisoryResponse(BaseModel):
    session_id: str
    advisory: str
    advisory_hindi: str | None = None
    compliance_status: str
    compliance_flags: list[str]
    safe_alternatives: list[str]
    data_sources: list[str]
    audit_trail: list[dict[str, Any]]
    market_signal: dict[str, Any] | None = None
    scheme_eligibility: list[dict[str, Any]]
    confidence_score: float
    action_steps: list[str] = []
    image_analysis: dict[str, Any] | None = None


app = FastAPI(title="KrishiMitra API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


audit_logger = AuditLogger()
compliance_engine = ComplianceEngine()
agent = KrishiAgent(audit_logger=audit_logger, compliance_engine=compliance_engine)


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "KrishiMitra API - Agricultural advisory backend",
        "version": "1.2.0",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/api/advise", response_model=AdvisoryResponse)
async def get_advisory(request: TextQueryRequest) -> dict[str, Any]:
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    session_id = request.session_id or str(uuid.uuid4())
    audit_logger.start_session(
        session_id,
        {
            "query": request.query,
            "language": request.language,
            "location": request.location,
            "crop_type": request.crop_type,
            "soil_data": request.soil_data,
        },
    )

    try:
        return await agent.process(
            session_id=session_id,
            query=request.query,
            language=request.language,
            location=request.location or "Rewa, Madhya Pradesh",
            soil_data=request.soil_data,
            crop_type=request.crop_type,
        )
    except HTTPException:
        raise
    except Exception as exc:
        audit_logger.log_error(session_id, str(exc))
        raise HTTPException(status_code=500, detail="Unable to generate advisory.") from exc


@app.post("/api/image/inspect")
async def inspect_image(
    image: UploadFile = File(...),
    language: str = Form("hi"),
    crop_type: str = Form(""),
) -> dict[str, Any]:
    image_bytes = await image.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    return await agent.inspect_image(
        image_b64=image_b64,
        image_media_type=image.content_type or "image/jpeg",
        language=language,
        crop_hint=crop_type,
    )


@app.post("/api/advise/image", response_model=AdvisoryResponse)
async def get_advisory_with_image(
    image: UploadFile = File(...),
    query: str = Form("What issue do you see in this crop?"),
    location: str = Form("Rewa, Madhya Pradesh"),
    crop_type: str = Form(""),
    language: str = Form("hi"),
    session_id: str = Form(""),
) -> dict[str, Any]:
    active_session_id = session_id or str(uuid.uuid4())
    image_bytes = await image.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    audit_logger.start_session(
        active_session_id,
        {
            "query": query,
            "has_image": True,
            "image_filename": image.filename,
            "content_type": image.content_type,
            "location": location,
            "crop_type": crop_type,
            "language": language,
        },
    )

    try:
        return await agent.process(
            session_id=active_session_id,
            query=query,
            language=language,
            location=location,
            crop_type=crop_type,
            image_b64=image_b64,
            image_media_type=image.content_type or "image/jpeg",
        )
    except Exception as exc:
        audit_logger.log_error(active_session_id, str(exc))
        raise HTTPException(status_code=500, detail="Unable to analyze crop image.") from exc


@app.get("/api/audit/{session_id}")
async def get_audit_trail(session_id: str) -> list[dict[str, Any]]:
    trail = audit_logger.get_trail(session_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Session not found")
    return trail


@app.get("/api/compliance/pesticides")
async def get_pesticide_info(name: str) -> dict[str, Any]:
    return compliance_engine.check_pesticide(name)


@app.get("/api/mandi/prices")
async def get_mandi_prices(crop: str, location: str = "Rewa") -> dict[str, Any]:
    from services.mandi import MandiService

    mandi = MandiService()
    return await mandi.get_prices(crop, location)
