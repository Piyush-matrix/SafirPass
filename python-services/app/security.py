from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta
from uuid import UUID

from app.time import utc_now


class QrTokenError(ValueError):
    pass


class ExpiredQrTokenError(QrTokenError):
    pass


class QrTokenSigner:
    def __init__(self, secret: str, ttl_seconds: int) -> None:
        self._secret = secret.encode("utf-8")
        self._ttl_seconds = ttl_seconds

    def issue(self, credential_id: UUID) -> tuple[str, datetime]:
        expires_at = utc_now() + timedelta(seconds=self._ttl_seconds)
        payload = {
            "credential_id": str(credential_id),
            "expires_at": int(expires_at.timestamp()),
            "nonce": secrets.token_urlsafe(12),
        }
        encoded_payload = self._encode(json.dumps(payload, separators=(",", ":")).encode())
        signature = hmac.new(
            self._secret, encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        return f"{encoded_payload}.{self._encode(signature)}", expires_at

    def verify(self, token: str) -> UUID:
        try:
            encoded_payload, encoded_signature = token.split(".", maxsplit=1)
            expected_signature = hmac.new(
                self._secret, encoded_payload.encode("ascii"), hashlib.sha256
            ).digest()
            supplied_signature = self._decode(encoded_signature)
            if not hmac.compare_digest(expected_signature, supplied_signature):
                raise QrTokenError("invalid QR token signature")
            payload = json.loads(self._decode(encoded_payload))
            expires_at = int(payload["expires_at"])
            credential_id = UUID(payload["credential_id"])
        except (binascii.Error, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            if isinstance(error, QrTokenError):
                raise
            raise QrTokenError("invalid QR token") from error

        if utc_now().timestamp() >= expires_at:
            raise ExpiredQrTokenError("QR token has expired")
        return credential_id

    @staticmethod
    def _encode(value: bytes) -> str:
        return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")

    @staticmethod
    def _decode(value: str) -> bytes:
        padding = "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(value + padding)
