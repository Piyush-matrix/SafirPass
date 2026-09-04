import os
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.security import QrTokenSigner


def make_client() -> TestClient:
    app = create_app(
        settings=Settings(qr_signing_secret="test-signing-secret", qr_ttl_seconds=60)
    )
    return TestClient(app)


def create_tourist(client: TestClient) -> str:
    response = client.post(
        "/v1/tourists", json={"display_name": "Asha Patel", "nationality": "India"}
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_credential_verification_and_sos_flow() -> None:
    client = make_client()
    tourist_id = create_tourist(client)
    tourist_headers = {"X-Tourist-Id": tourist_id}

    credential_response = client.post("/v1/credentials", headers=tourist_headers)
    assert credential_response.status_code == 201
    credential_id = credential_response.json()["id"]

    signer = QrTokenSigner(secret="test-signing-secret", ttl_seconds=60)
    token, _ = signer.issue(UUID(credential_id))

    verification_response = client.post(
        "/v1/verifications",
        headers={"X-Partner-Id": str(uuid4())},
        json={"qr_token": token, "purpose": "hotel check-in"},
    )
    assert verification_response.status_code == 200
    assert verification_response.json()["valid"] is True

    sos_response = client.post(
        "/v1/incidents/sos",
        headers=tourist_headers,
        json={
            "location": {"latitude": 28.6139, "longitude": 77.209},
            "message": "I need medical help.",
        },
    )
    assert sos_response.status_code == 201
    assert sos_response.json()["status"] == "open"


def test_qr_token_cannot_be_verified_after_tampering() -> None:
    client = make_client()
    tourist_id = create_tourist(client)
    tourist_headers = {"X-Tourist-Id": tourist_id}

    credential_id = client.post("/v1/credentials", headers=tourist_headers).json()["id"]
    signer = QrTokenSigner(secret="test-signing-secret", ttl_seconds=60)
    token, _ = signer.issue(UUID(credential_id))

    response = client.post(
        "/v1/verifications",
        headers={"X-Partner-Id": str(uuid4())},
        json={"qr_token": f"{token}tampered", "purpose": "hotel check-in"},
    )
    assert response.status_code == 400


def test_multilingual_assistant_and_aws_configuration_boundary() -> None:
    client = make_client()

    assistant_response = client.post(
        "/v1/integrations/assistant/messages",
        json={"message": "मुझे मदद चाहिए"},
    )
    assert assistant_response.status_code == 200
    assert assistant_response.json()["language"] == "hi"

    liveness_response = client.post("/v1/integrations/kyc/liveness-sessions")
    if os.getenv("REKOGNITION_ENABLED", "false").lower() == "true":
        assert liveness_response.status_code == 200
        assert "session_id" in liveness_response.json()
    else:
        assert liveness_response.status_code == 503


def test_document_ml_pipeline_and_dataset_collection() -> None:
    import base64
    import cv2
    import numpy as np

    client = make_client()
    user_id = str(uuid4())

    # Create dummy 100x150 test image
    dummy_img = np.full((100, 150, 3), 200, dtype=np.uint8)
    cv2.putText(dummy_img, "PASSPORT", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    _, buffer = cv2.imencode(".jpg", dummy_img)
    b64_img = base64.b64encode(buffer).decode("utf-8")

    # 1. Test real-time verification endpoint
    verify_res = client.post(
        "/v1/integrations/documents/verify",
        json={"doc_type": "passport", "image_base64": b64_img},
    )
    assert verify_res.status_code == 200
    assert "features" in verify_res.json()
    assert verify_res.json()["features"]["aspect_ratio"] == 1.5

    # 2. Test dataset sample ingestion
    sample_res = client.post(
        "/v1/integrations/documents/samples",
        json={
            "user_id": user_id,
            "doc_type": "passport",
            "file_name": "passport_scan.jpg",
            "file_url": "https://res.cloudinary.com/sample.jpg",
            "image_base64": b64_img,
        },
    )
    assert sample_res.status_code == 200
    assert sample_res.json()["status"] == "pending_review"

    # 3. Test ground-truth labeling
    label_res = client.patch(
        "/v1/integrations/documents/samples/label",
        json={
            "user_id": user_id,
            "doc_type": "passport",
            "is_authentic": True,
            "admin_notes": "Verified by authority",
        },
    )
    assert label_res.status_code == 200
    assert label_res.json()["labeled_count"] >= 1

    # 4. Test dataset stats
    stats_res = client.get("/v1/integrations/documents/stats")
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert data["total_samples"] >= 1
    assert data["labeled_verified"] >= 1


def test_document_model_training_endpoint() -> None:
    client = make_client()
    train_res = client.post("/v1/integrations/documents/train")
    assert train_res.status_code == 200
    data = train_res.json()
    assert "trained" in data


