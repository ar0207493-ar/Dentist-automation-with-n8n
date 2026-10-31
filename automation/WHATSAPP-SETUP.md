# Dentora WhatsApp notifications — Evolution API

The appointment workflow uses the clinic's connected `dentora` Evolution instance. Its 12-step chain acknowledges validated form requests with HTTP 202, then sends clinic email, drafts the note reply with Gemini, sends the patient email, and sends the clinic and patient WhatsApp notifications in the background.

## Server configuration

- `EVOLUTION_API_URL`: `https://dentora-evolution-api.onrender.com`
- `EVOLUTION_INSTANCE_NAME`: `dentora`
- `EVOLUTION_API_KEY`: the existing instance-scoped token, stored only in Render environment settings and n8n's encrypted credential store. Never place it in website code or GitHub.

The custom `Dentora Evolution` node sends `POST /message/sendText/dentora` with the `apikey` header and JSON `{ number, text, linkPreview: false }`. Clinic and patient numbers are international digits with country code. The clinic recipient is `923196982582`; the patient recipient is taken from the validated form. Both messages retain the submitted details, and the patient receipt includes the note-specific reply.

Before sending, a read-only connection check can wait up to three minutes for the free Evolution web service to wake up. Only these GET checks may repeat. Message POSTs are never retried automatically, and there is no automatic fallback to another provider. A message id/PENDING response means accepted or queued, not proof of delivery. A disconnected instance, rate limit or timeout is recorded as a sanitized error.

## Deployment and migration

Startup runs `docker/repair-evolution.cjs`. It imports the instance credential, updates only the five WhatsApp preparation/send/wait/result nodes in the existing published workflow `KdkIqV3oNSgY3p60`, publishes it, and re-exports the published version to verify it. Existing Gmail, Gemini, validation and response nodes are preserved. Marker `dentoraEvolutionNotificationsV16` makes subsequent starts idempotent. If publication verification fails, the original published definition is restored.

The Render API saves individual environment keys without deploying. The matching non-secret defaults are in `render.yaml`; the secret is a `sync: false` placeholder. Existing Green API credentials/settings may remain for a deliberate rollback but are not referenced by the active Evolution workflow.

## Verification restriction

The owner requested no test WhatsApp messages. Do not submit an appointment form, manually execute the workflow, or call any send endpoint to verify this integration. Credential creation/import has no provider test. Local tests mock HTTP. Live checks read deployment status, n8n readiness, published-migration logs and Evolution connection state only. Actual delivery remains untested until an authorized real appointment is submitted.

Free Render services can sleep and have limited resources. The free database expires after 30 days; this is a demonstration setup rather than guaranteed always-on hosting.
