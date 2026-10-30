# Appointment WhatsApp notifications

The appointment workflow sends clinic and patient email first, then sends the clinic alert and patient receipt using WaAPI. WhatsApp requests have a 25-second timeout, do not automatically retry, and cannot turn a successful email request into an error. The response reports API acceptance separately from email success; acceptance does not guarantee device delivery.

Before sending a patient message, WaAPI resolves the phone number to its canonical WhatsApp ID. Both `@c.us` and `@lid` IDs are supported; the workflow does not assume every registered number uses the former. A two-second pause separates clinic and patient sends. Failed patient sends are shown separately on the website, and the response provides a sanitized failure category.

The personalized note answers the actual question. Simple questions receive one concise sentence; detailed notes can receive two to four relevant sentences. Clinic hours, prices and availability are not invented. A standard acknowledgement is used only if the AI call fails.

For the free demo, the main Node heap is capped at 320 MB, the JavaScript runner at 64 MB, and production executions run one at a time. These settings mitigate the observed 256 MB heap exhaustion; they do not increase the container's physical RAM or remove free-service sleep. Render recommends at least 2 GB RAM for n8n in production.

Set `WAAPI_API_TOKEN` and `WAAPI_INSTANCE_ID` privately in the Render Environment settings. The linked WaAPI instance must report `ready`. Startup imports the WaAPI and Gemini tokens into encrypted n8n Header Auth credentials using protected temporary files, which are then removed. Workflow nodes use those credentials; direct access to environment variables stays blocked. Credential values never belong in workflow exports or GitHub. The clinic alert recipient is `+923196982582`.

For a manual import, select a Header Auth credential on the Gemini node (`x-goog-api-key`) and both WhatsApp nodes (`Authorization`, with value `Bearer <token>`). Replace `REPLACE_WITH_INSTANCE_ID` in both WhatsApp URLs with the linked instance ID. The Render startup migration does this wiring automatically for the existing appointment workflow.

The website requires a WhatsApp number and shows the appointment-update notice beside Submit. Submitting the form acknowledges email and WhatsApp updates; there is no separate checkbox. Pakistani local mobile numbers are converted from `03…` to `+923…`; other numbers must include their country code. The workflow validates the normalized number before sending email.

The patient receives a receipt, preferred date/time and, when a note exists, the same courteous reply prepared for the email. Only the clinic can confirm the appointment. Inbound chatbot replies and automatic opt-out processing are not implemented in this notification workflow; the clinic contact is included for help and opt-out requests.

Do not bulk-retry a failed form submission: an email or a WhatsApp message might already have been accepted. Check the reported statuses and the WaAPI instance first. Automatic retries are disabled to avoid uncertain duplicate sends.

The Render startup migration updates only the known appointment workflow, preserves its connected Gmail credential references, and publishes the new definition. A non-matching workflow structure is left for manual review.
