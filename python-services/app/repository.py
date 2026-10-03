from __future__ import annotations

from threading import RLock
from uuid import UUID, uuid4

from app.models import (
    Credential,
    CredentialStatus,
    Incident,
    IncidentStatus,
    SosCreate,
    Tourist,
    TouristCreate,
)
from app.time import utc_now


class NotFoundError(KeyError):
    pass


class MvpRepository:
    """Thread-safe in-memory store for local development and tests."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._tourists: dict[UUID, Tourist] = {}
        self._credentials: dict[UUID, Credential] = {}
        self._incidents: dict[UUID, Incident] = {}
        self.verification_audits: list[dict[str, object]] = []

    def create_tourist(self, payload: TouristCreate) -> Tourist:
        tourist = Tourist(id=uuid4(), created_at=utc_now(), **payload.model_dump())
        with self._lock:
            self._tourists[tourist.id] = tourist
        return tourist

    def get_tourist(self, tourist_id: UUID) -> Tourist:
        with self._lock:
            tourist = self._tourists.get(tourist_id)
        if tourist is None:
            raise NotFoundError("tourist not found")
        return tourist

    def create_credential(self, tourist_id: UUID) -> Credential:
        credential = Credential(
            id=uuid4(),
            tourist_id=tourist_id,
            status=CredentialStatus.ACTIVE,
            issued_at=utc_now(),
        )
        with self._lock:
            self._credentials[credential.id] = credential
        return credential

    def get_credential(self, credential_id: UUID) -> Credential:
        with self._lock:
            credential = self._credentials.get(credential_id)
        if credential is None:
            raise NotFoundError("credential not found")
        return credential

    def add_verification_audit(self, **entry: object) -> UUID:
        audit_id = uuid4()
        with self._lock:
            self.verification_audits.append({"id": audit_id, **entry})
        return audit_id

    def create_incident(self, tourist_id: UUID, payload: SosCreate) -> Incident:
        incident = Incident(
            id=uuid4(),
            tourist_id=tourist_id,
            status=IncidentStatus.OPEN,
            location=payload.location,
            message=payload.message,
            created_at=utc_now(),
        )
        with self._lock:
            self._incidents[incident.id] = incident
        return incident

    def get_incident(self, incident_id: UUID) -> Incident:
        with self._lock:
            incident = self._incidents.get(incident_id)
        if incident is None:
            raise NotFoundError("incident not found")
        return incident
