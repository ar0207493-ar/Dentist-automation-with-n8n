# Dentora appointment email workflow

Import `dentora-email-appointments.json` into the local n8n instance. Use the Gmail account `ar0207493@gmail.com` for both Gmail nodes. The workflow validates the request, emails the clinic at `ar0207493@gmail.com`, then sends the patient a professional receipt email to the address entered in the form. It clearly says the appointment is only confirmed after the clinic follows up.

## Finish setup in n8n

1. Sign in to n8n and import the JSON workflow.
2. Connect the same Gmail credential to both Gmail nodes. Authorize the Gmail account that will send the messages.
3. Save and publish the workflow. n8n will show the production webhook URL in the Webhook node.
4. Copy that production URL into the appointment form's `data-webhook-url` in `dist/index.html`.
5. Set the Webhook node's Allowed Origins to the exact site origin(s) that will use the form. For local preview, use `http://127.0.0.1:4173` and/or `http://localhost:4173`.

The website reports success only after both emails finish. Until the workflow is published, Gmail credentials are connected, and its production URL is added to the form, it will state that the email service is not connected. A local n8n webhook on this PC is reachable only to users whose browser can access this PC; a Vercel deployment needs a publicly reachable HTTPS n8n endpoint.

WhatsApp is intentionally not part of this workflow.
