# Dentora appointment email workflow

Import `dentora-email-appointments.json` into the hosted n8n instance at `https://dentist-n8n-server.onrender.com`. Connect the same Gmail OAuth2 credential for `ar0207493@gmail.com` to both Gmail HTTP Request nodes. The workflow validates the request, sends a branded notification to the clinic, then sends the patient a matching receipt email. When a note is provided, Gemini drafts a short, polite, non-clinical acknowledgement based on the note; if Gemini is unavailable, the email uses a standard courteous reply. Both emails use the Dentora logo, dark teal banner, and footer links. The patient email clearly says the appointment is only confirmed after the clinic follows up.

For Gemini, add `GEMINI_API_KEY` as a secret in the Render service's **Environment** settings. Do not place the key in this repository or the website. Only the note text is sent to Gemini; the patient's name, email, and phone stay out of that request.

## Finish setup in n8n

1. Sign in to n8n and import the JSON workflow.
2. Connect the same Gmail OAuth2 credential to the two email HTTP Request nodes. Select **Predefined Credential Type → Gmail OAuth2 API** and authorize `ar0207493@gmail.com` with `https://www.googleapis.com/auth/gmail.send`.
   These nodes send directly to Gmail's `users/me/messages/send` endpoint. The validation step prepares branded HTML MIME messages, including the Dentora sender name. They do not request the Gmail profile or need mailbox-reading permissions.
3. Save and publish the workflow. n8n will show the production webhook URL in the Webhook node.
4. Copy that production URL into the appointment form's `data-webhook-url` in `dist/index.html`.
5. Set the Webhook node's Allowed Origins to the exact site origin(s) that will use the form. For local preview, use `http://127.0.0.1:4173` and/or `http://localhost:4173`.

The checked-in form uses `https://dentist-n8n-server.onrender.com/webhook/dentora-appointment`. It reports success only when the final response confirms that both emails finished. A published workflow and connected Gmail credentials are required. If a step fails, inspect the latest failed execution in n8n before retrying; the clinic email may already have been sent even if the patient email failed. The free Render demo may sleep when inactive.

WhatsApp is intentionally not part of this workflow.

