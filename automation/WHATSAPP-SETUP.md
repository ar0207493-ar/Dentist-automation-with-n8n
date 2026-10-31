# Dentora WhatsApp notifications — Green API

The published appointment workflow now uses Green API. Email, Gemini replies and the early HTTP 202 receipt remain in place.

## Configuration

- GREEN_API_URL: the HTTPS API URL shown in the Green API console.
- GREEN_API_INSTANCE_ID: the authorized instance ID.
- GREEN_API_TOKEN: save only in Render's environment settings; never commit or place it in the browser.

The Docker image loads the small Dentora Green API node and credential from /opt/dentora/custom through N8N_CUSTOM_EXTENSIONS. Startup imports the Green API credential into n8n's encrypted credential store and migrates the existing workflow while preserving its Gmail OAuth credentials.

A real appointment request queues an admin notification and the patient's full receipt. No contact-lookup request is needed. Automatic message retries are disabled to avoid duplicate notifications. An idMessage means the provider queued the message, not that it was delivered.

## Verification restriction

The owner requested integration without sending test messages. Do not submit the appointment form, run the workflow manually, test credentials against the provider, or call Green API to verify setup. Local checks use mocked HTTP only. Deployment verification uses Render deployment status and n8n readiness only.

The Developer plan supports three distinct chats, with monthly limits resetting on the first day of the month; it is not a three-message allowance. See https://green-api.com/en/docs/about-tariffs/ .
