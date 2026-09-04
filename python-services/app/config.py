from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    qr_signing_secret: str
    qr_ttl_seconds: int

    @classmethod
    def from_environment(cls) -> "Settings":
        ttl_seconds = int(os.getenv("QR_TTL_SECONDS", "60"))
        if ttl_seconds < 15:
            raise ValueError("QR_TTL_SECONDS must be at least 15 seconds")

        return cls(
            qr_signing_secret=os.getenv(
                "QR_SIGNING_SECRET", "development-only-change-me-before-deployment"
            ),
            qr_ttl_seconds=ttl_seconds,
        )
