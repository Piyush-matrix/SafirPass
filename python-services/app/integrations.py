from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Float, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.document_ml import DocumentFeatureExtractor, DocumentMlModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class LocationEvent(Base):
    __tablename__ = "location_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tourist_id: Mapped[str] = mapped_column(String(36), index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    speed_kph: Mapped[float] = mapped_column(Float)
    anomaly_score: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    tourist_id: Mapped[str] = mapped_column(String(36), index=True)
    channel: Mapped[str] = mapped_column(String(32))
    delivery_status: Mapped[str] = mapped_column(String(32))
    message: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DocumentTrainingSample(Base):
    __tablename__ = "document_training_samples"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), index=True)
    doc_type: Mapped[str] = mapped_column(String(32), index=True)
    file_name: Mapped[str] = mapped_column(String(255), default="")
    file_url: Mapped[str] = mapped_column(Text, default="")
    feature_vector_json: Mapped[str] = mapped_column(Text, default="{}")
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(32), default="pending_review")
    is_authentic: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)



from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tourist_safety.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {"connect_timeout": 10}
)

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base.metadata.create_all(engine)




class LivenessSessionResponse(BaseModel):
    session_id: str


class FaceMatchRequest(BaseModel):
    document_image_base64: str = Field(min_length=64)
    selfie_image_base64: str = Field(min_length=64)


class LocationRequest(BaseModel):
    tourist_id: UUID
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    speed_kph: float = Field(ge=0, le=300)
    phone_number: str | None = Field(default=None, max_length=30)


class NotificationRequest(BaseModel):
    tourist_id: UUID
    message: str = Field(min_length=1, max_length=500)
    phone_number: str | None = Field(default=None, max_length=30)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    language: str | None = Field(default=None, pattern="^(en|hi|es|fr)$")


class DocumentVerifyRequest(BaseModel):
    doc_type: str = Field(min_length=2, max_length=50)
    image_base64: str = Field(min_length=20)


class DocumentSampleCreateRequest(BaseModel):
    user_id: UUID
    doc_type: str = Field(min_length=2, max_length=50)
    file_name: str = Field(default="", max_length=255)
    file_url: str = Field(default="", max_length=1000)
    image_base64: str | None = Field(default=None)


class DocumentSampleLabelRequest(BaseModel):
    user_id: UUID
    is_authentic: bool
    doc_type: str | None = Field(default=None)
    admin_notes: str | None = Field(default=None, max_length=500)



class OpenCvVerifier:
    @staticmethod
    def quality(image_base64: str) -> dict[str, float | bool]:
        import cv2
        import numpy as np

        try:
            image = cv2.imdecode(
                np.frombuffer(base64.b64decode(image_base64, validate=True), dtype=np.uint8),
                cv2.IMREAD_COLOR,
            )
        except Exception as error:
            raise HTTPException(400, "invalid base64 image") from error
        if image is None:
            raise HTTPException(400, "image could not be decoded")
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        face_detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        face_count = len(face_detector.detectMultiScale(gray, 1.1, 5))
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(gray.mean())
        return {
            "face_detected": bool(face_count),
            "blur_score": round(blur_score, 2),
            "brightness": round(brightness, 2),
            "acceptable": bool(face_count) and blur_score >= 80 and 45 <= brightness <= 210,
        }


class RekognitionVerifier:
    def __init__(self) -> None:
        self.enabled = os.getenv("REKOGNITION_ENABLED", "false").lower() == "true"
        self.region = os.getenv("AWS_REGION", "ap-south-1")

    def _client(self):
        import boto3

        return boto3.client("rekognition", region_name=self.region)

    def liveness_session(self) -> str:
        if not self.enabled:
            raise HTTPException(503, "set REKOGNITION_ENABLED=true and configure AWS credentials")
        return self._client().create_face_liveness_session(
            Settings={"AuditImagesLimit": 0}
        )["SessionId"]

    def compare(self, document: bytes, selfie: bytes) -> dict[str, float | bool]:
        if not self.enabled:
            raise HTTPException(503, "set REKOGNITION_ENABLED=true and configure AWS credentials")
        matches = self._client().compare_faces(
            SourceImage={"Bytes": document},
            TargetImage={"Bytes": selfie},
            SimilarityThreshold=90,
            QualityFilter="MEDIUM",
        ).get("FaceMatches", [])
        similarity = float(matches[0]["Similarity"]) if matches else 0.0
        return {"matched": bool(matches), "similarity": round(similarity, 2)}


class SnsNotifier:
    def send(self, phone_number: str | None, message: str) -> str:
        topic_arn = os.getenv("SNS_TOPIC_ARN")
        if not phone_number and not topic_arn:
            return "recorded"
        import boto3

        client = boto3.client("sns", region_name=os.getenv("AWS_REGION", "ap-south-1"))
        if phone_number:
            client.publish(PhoneNumber=phone_number, Message=message)
        else:
            client.publish(TopicArn=topic_arn, Message=message)
        return "sent"


class AnomalyDetector:
    def __init__(self) -> None:
        self.samples: list[list[float]] = []

    def score(self, location: LocationRequest) -> tuple[bool, float]:
        from sklearn.ensemble import IsolationForest

        sample = [location.latitude, location.longitude, location.speed_kph]
        self.samples.append(sample)
        if len(self.samples) < 20:
            return False, 0.0
        model = IsolationForest(contamination=0.08, random_state=42).fit(self.samples[-500:])
        score = float(-model.decision_function([sample])[0])
        return model.predict([sample])[0] == -1, round(score, 4)


class SafetyAssistant:
    messages = {
        "en": {"emergency": "Call local emergency services now and use the app SOS button.", "safety": "Stay in a public, well-lit area and share your route with a trusted contact.", "default": "I can help with safety guidance, emergency steps, and verified travel services."},
        "hi": {"emergency": "अभी स्थानीय आपातकालीन सेवा को कॉल करें और ऐप में SOS बटन दबाएं।", "safety": "सार्वजनिक और रोशनी वाले स्थान पर रहें तथा अपना मार्ग विश्वसनीय संपर्क के साथ साझा करें।", "default": "मैं सुरक्षा, SOS और सत्यापित यात्रा सेवाओं में सहायता कर सकता हूँ।"},
        "es": {"emergency": "Llame ahora a los servicios de emergencia locales y use el botón SOS.", "safety": "Permanezca en una zona pública iluminada y comparta su ruta.", "default": "Puedo ayudar con seguridad, SOS y servicios de viaje verificados."},
        "fr": {"emergency": "Appelez immédiatement les services d'urgence locaux et utilisez le bouton SOS.", "safety": "Restez dans un lieu public éclairé et partagez votre itinéraire.", "default": "Je peux aider avec la sécurité, le SOS et les services vérifiés."},
    }

    def reply(self, request: AssistantRequest) -> dict[str, str]:
        language = request.language or ("hi" if any("\u0900" <= c <= "\u097f" for c in request.message) else "en")
        text = request.message.lower()
        intent = "emergency" if any(word in text for word in ("sos", "emergency", "help", "danger", "accident", "hospital")) else "safety" if any(word in text for word in ("safe", "scam", "risk")) else "default"
        return {"language": language, "intent": intent, "response": self.messages[language][intent]}


router = APIRouter(prefix="/v1/integrations", tags=["integrations"])
rekognition = RekognitionVerifier()
notifier = SnsNotifier()
anomaly_detector = AnomalyDetector()
assistant = SafetyAssistant()
document_ml = DocumentMlModel()


@router.post("/kyc/liveness-sessions", response_model=LivenessSessionResponse)
def create_liveness_session() -> LivenessSessionResponse:
    return LivenessSessionResponse(session_id=rekognition.liveness_session())


@router.post("/kyc/face-match")
def face_match(payload: FaceMatchRequest) -> dict[str, object]:
    document_quality = OpenCvVerifier.quality(payload.document_image_base64)
    selfie_quality = OpenCvVerifier.quality(payload.selfie_image_base64)
    if not document_quality["acceptable"] or not selfie_quality["acceptable"]:
        return {"approved": False, "document_quality": document_quality, "selfie_quality": selfie_quality}
    result = rekognition.compare(base64.b64decode(payload.document_image_base64), base64.b64decode(payload.selfie_image_base64))
    return {"approved": result["matched"], "document_quality": document_quality, "selfie_quality": selfie_quality, **result}


@router.post("/locations")
def record_location(payload: LocationRequest) -> dict[str, object]:
    anomalous, score = anomaly_detector.score(payload)
    delivery_status = "not_required"
    with SessionLocal() as session:
        session.add(LocationEvent(id=str(uuid4()), tourist_id=str(payload.tourist_id), latitude=payload.latitude, longitude=payload.longitude, speed_kph=payload.speed_kph, anomaly_score=score))
        if anomalous:
            message = "Safety alert: unusual movement detected. Please confirm that you are safe."
            delivery_status = notifier.send(payload.phone_number, message)
            session.add(NotificationEvent(id=str(uuid4()), tourist_id=str(payload.tourist_id), channel="sns", delivery_status=delivery_status, message=message))
        session.commit()
    return {"anomaly_detected": anomalous, "anomaly_score": score, "notification_status": delivery_status}


@router.post("/notifications")
def send_notification(payload: NotificationRequest) -> dict[str, str]:
    delivery_status = notifier.send(payload.phone_number, payload.message)
    with SessionLocal() as session:
        session.add(NotificationEvent(id=str(uuid4()), tourist_id=str(payload.tourist_id), channel="sns", delivery_status=delivery_status, message=payload.message))
        session.commit()
    return {"status": delivery_status}


@router.post("/assistant/messages")
def assistant_message(payload: AssistantRequest) -> dict[str, str]:
    return assistant.reply(payload)


@router.post("/documents/verify")
def verify_document(payload: DocumentVerifyRequest) -> dict[str, Any]:
    features = DocumentFeatureExtractor.extract_from_base64(payload.image_base64)
    evaluation = document_ml.evaluate(payload.doc_type, features)
    return {
        "doc_type": payload.doc_type,
        "features": features,
        **evaluation,
    }


@router.post("/documents/samples")
def ingest_document_sample(payload: DocumentSampleCreateRequest) -> dict[str, Any]:
    features: dict[str, Any] = {}
    quality = 0.0
    if payload.image_base64:
        features = DocumentFeatureExtractor.extract_from_base64(payload.image_base64)
        quality = float(features.get("blur_score", 0.0))

    sample_id = str(uuid4())
    with SessionLocal() as session:
        sample = DocumentTrainingSample(
            id=sample_id,
            user_id=str(payload.user_id),
            doc_type=payload.doc_type,
            file_name=payload.file_name or f"{payload.doc_type}_document",
            file_url=payload.file_url or "",
            feature_vector_json=json.dumps(features),
            quality_score=quality,
            status="pending_review",
            is_authentic=None,
        )
        session.add(sample)
        session.commit()

    evaluation = document_ml.evaluate(payload.doc_type, features) if features else {}
    return {
        "sample_id": sample_id,
        "status": "pending_review",
        "doc_type": payload.doc_type,
        "quality_score": quality,
        "evaluation": evaluation,
        "message": "Document sample ingested into dataset for ML training.",
    }


@router.patch("/documents/samples/label")
def label_document_samples(payload: DocumentSampleLabelRequest) -> dict[str, Any]:
    with SessionLocal() as session:
        query = select(DocumentTrainingSample).where(DocumentTrainingSample.user_id == str(payload.user_id))
        if payload.doc_type:
            query = query.where(DocumentTrainingSample.doc_type == payload.doc_type)

        samples = list(session.scalars(query))
        labeled_count = 0
        status_label = "verified" if payload.is_authentic else "rejected"

        for sample in samples:
            sample.is_authentic = payload.is_authentic
            sample.status = status_label
            if payload.admin_notes:
                sample.admin_notes = payload.admin_notes
            labeled_count += 1

        session.commit()

    return {
        "success": True,
        "labeled_count": labeled_count,
        "is_authentic": payload.is_authentic,
        "message": f"Updated {labeled_count} sample(s) with ground-truth label: {status_label}.",
    }


@router.post("/documents/train")
def train_document_model() -> dict[str, Any]:
    with SessionLocal() as session:
        query = select(DocumentTrainingSample).where(DocumentTrainingSample.is_authentic.isnot(None))
        samples = list(session.scalars(query))

        training_data: list[tuple[list[float], int]] = []
        for s in samples:
            try:
                feat_dict = json.loads(s.feature_vector_json)
                vec = feat_dict.get("vector")
                if vec and len(vec) == len(DocumentFeatureExtractor.FEATURE_NAMES):
                    label = 1 if s.is_authentic else 0
                    training_data.append((vec, label))
            except Exception:
                continue

    result = document_ml.train(training_data)
    return result


@router.get("/documents/stats")
def get_dataset_stats() -> dict[str, Any]:
    with SessionLocal() as session:
        total = session.scalar(select(func.count()).select_from(DocumentTrainingSample)) or 0
        verified = session.scalar(select(func.count()).select_from(DocumentTrainingSample).where(DocumentTrainingSample.is_authentic == True)) or 0
        rejected = session.scalar(select(func.count()).select_from(DocumentTrainingSample).where(DocumentTrainingSample.is_authentic == False)) or 0
        pending = session.scalar(select(func.count()).select_from(DocumentTrainingSample).where(DocumentTrainingSample.is_authentic.is_(None))) or 0

        type_counts = dict(
            session.execute(
                select(DocumentTrainingSample.doc_type, func.count(DocumentTrainingSample.id)).group_by(
                    DocumentTrainingSample.doc_type
                )
            ).all()
        )

    return {
        "total_samples": total,
        "labeled_verified": verified,
        "labeled_rejected": rejected,
        "pending_review": pending,
        "by_document_type": type_counts,
        "model_trained": document_ml._model is not None,
    }

