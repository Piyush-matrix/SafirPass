from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, FastAPI, Header, Request, status

from app.config import Settings
from app.models import (
    Credential,
    Health,
    Incident,
    SosCreate,
    Tourist,
    TouristCreate,
    VerificationCreate,
    VerificationResult,
)
from app.repository import MvpRepository
from app.security import QrTokenSigner
from app.services import TouristSafetyService
from app.integrations import router as integrations_router

TouristId = Annotated[UUID, Header(alias="X-Tourist-Id")]
PartnerId = Annotated[UUID, Header(alias="X-Partner-Id")]


def get_service(request: Request) -> TouristSafetyService:
    return request.app.state.service


Service = Annotated[TouristSafetyService, Depends(get_service)]


def create_app(
    *, repository: MvpRepository | None = None, settings: Settings | None = None
) -> FastAPI:
    active_settings = settings or Settings.from_environment()
    app = FastAPI(title="Tourist Safety API", version="0.1.0")
    app.state.service = TouristSafetyService(
        repository or MvpRepository(),
        QrTokenSigner(
            secret=active_settings.qr_signing_secret,
            ttl_seconds=active_settings.qr_ttl_seconds,
        ),
    )

    @app.get("/health", response_model=Health)
    def health() -> Health:
        return Health()

    @app.post("/v1/tourists", response_model=Tourist, status_code=status.HTTP_201_CREATED)
    def create_tourist(payload: TouristCreate, service: Service) -> Tourist:
        return service.create_tourist(payload)

    @app.post(
        "/v1/credentials", response_model=Credential, status_code=status.HTTP_201_CREATED
    )
    def issue_credential(
        tourist_id: TouristId, service: Service
    ) -> Credential:
        return service.issue_credential(tourist_id)

    @app.post("/v1/verifications", response_model=VerificationResult)
    def verify_qr(
        payload: VerificationCreate,
        partner_id: PartnerId,
        service: Service,
    ) -> VerificationResult:
        return service.verify_qr(partner_id, payload)

    @app.post(
        "/v1/incidents/sos", response_model=Incident, status_code=status.HTTP_201_CREATED
    )
    def create_sos(
        payload: SosCreate,
        tourist_id: TouristId,
        service: Service,
    ) -> Incident:
        return service.create_sos(tourist_id, payload)

    @app.get("/v1/incidents/{incident_id}", response_model=Incident)
    def get_incident(
        incident_id: UUID,
        tourist_id: TouristId,
        service: Service,
    ) -> Incident:
        return service.get_incident(tourist_id, incident_id)

    app.include_router(integrations_router)
    return app


app = create_app()
