# Tourist Safety API MVP

A FastAPI starter for the first high-value flows in the Smart Tourist Safety platform:

- KYC application intake and authority review
- Verified digital credentials with short-lived, signed QR tokens
- QR verification audit records for trusted partners
- SOS incident creation with an exact location

The project is deliberately a modular monolith. It uses an in-memory repository so the API is runnable without infrastructure; replace it with PostgreSQL/PostGIS before a real deployment.

## Run locally

```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the interactive OpenAPI documentation.

## Demo flow

1. `POST /v1/tourists` to create a tourist profile.
2. Send its ID in `X-Tourist-Id` to `POST /v1/credentials` to issue a credential.
3. Verify QR tokens using `POST /v1/verifications` as a partner with `X-Partner-Id`.
4. Create an SOS incident with `POST /v1/incidents/sos`.

The identity headers are a development-only boundary. Replace them with an OIDC provider such as Amazon Cognito, enforce role claims, and use a persistent audit store before using this beyond a demo.

## Production integration points

- Upload files to encrypted S3 using presigned URLs; the API should only receive object references.
- Run OpenCV quality checks before verification, then Amazon Rekognition Face Liveness and face comparison in a background worker.
- Store structured records in PostgreSQL with PostGIS; partition high-volume location events.
- Use Redis for rate limits and transient QR verification state, SQS for jobs, and FCM/SNS for notifications.
- Keep biometrics, passports, and precise location data off-chain. If blockchain is later needed, anchor only a credential-status hash.

Set `QR_SIGNING_SECRET` to a long random value in every non-development environment. `QR_TTL_SECONDS` defaults to 60 seconds.

## Integrated services

Copy `.env.example` to `.env`, then start PostgreSQL with `docker compose up -d` from this directory. The API uses SQLite locally when `DATABASE_URL` is not set.

- `POST /v1/integrations/kyc/liveness-sessions` starts an AWS Rekognition Face Liveness session when `REKOGNITION_ENABLED=true`.
- `POST /v1/integrations/kyc/face-match` performs OpenCV image-quality checks before AWS Rekognition face comparison.
- `POST /v1/integrations/locations` persists location events, evaluates Isolation Forest anomaly scores, and records or sends SNS safety notifications.
- `POST /v1/integrations/notifications` records a notification and sends it through SNS when a phone number or `SNS_TOPIC_ARN` is configured.
- `POST /v1/integrations/assistant/messages` provides safety responses in English, Hindi, Spanish, and French.

AWS credentials must be supplied through the standard AWS SDK credential chain. Do not use automatic face-match outcomes as a final identity decision; retain an authority-review step.
