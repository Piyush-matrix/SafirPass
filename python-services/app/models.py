from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApiModel(BaseModel):
    model_config = ConfigDict(frozen=True)


class CredentialStatus(str, Enum):
    ACTIVE = "active"
    REVOKED = "revoked"


class IncidentStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class TouristCreate(ApiModel):
    display_name: str = Field(min_length=1, max_length=120)
    nationality: str = Field(min_length=2, max_length=80)


class Tourist(ApiModel):
    id: UUID
    display_name: str
    nationality: str
    created_at: datetime


class Credential(ApiModel):
    id: UUID
    tourist_id: UUID
    status: CredentialStatus
    issued_at: datetime


class VerificationCreate(ApiModel):
    qr_token: str = Field(min_length=20)
    purpose: str = Field(min_length=3, max_length=120)


class VerificationResult(ApiModel):
    audit_id: UUID
    credential_id: UUID
    valid: bool
    credential_status: CredentialStatus
    verified_at: datetime


class Coordinates(ApiModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class SosCreate(ApiModel):
    location: Coordinates
    message: str | None = Field(default=None, max_length=500)


class Incident(ApiModel):
    id: UUID
    tourist_id: UUID
    status: IncidentStatus
    location: Coordinates
    message: str | None
    created_at: datetime


class Health(ApiModel):
    status: str = "ok"
