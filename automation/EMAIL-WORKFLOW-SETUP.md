# Dentora appointment email workflow

Import `dentora-email-appointments.json` into the hosted n8n instance at `https://dentist-n8n-server.onrender.com`. Use the Gmail account `ar0207493@gmail.com` for both Gmail nodes. The workflow validates the request, emails the clinic at `ar0207493@gmail.com`, then sends the patient a professional receipt email to the address entered in the form. It clearly says the appointment is only confirmed after the clinic follows up.

## Finish setup in n8n

1. Sign in to n8n and import the JSON workflow.
2. Connect the same Gmail credential to both Gmail nodes. Authorize the Gmail account that will send the messages.
   For send-only OAuth (`https://www.googleapis.com/auth/gmail.send`), leave the optional **Sender Name** option removed from both nodes. n8n fetches the Gmail profile when that option is set, which requires additional permissions. The email body still uses the Dentora branding; the sender display name comes from the Gmail account.
3. Save and publish the workflow. n8n will show the production webhook URL in the Webhook node.
4. Copy that production URL into the appointment form's `data-webhook-url` in `dist/index.html`.
5. Set the Webhook node's Allowed Origins to the exact site origin(s) that will use the form. For local preview, use `http://127.0.0.1:4173` and/or `http://localhost:4173`.

The checked-in form uses `https://dentist-n8n-server.onrender.com/webhook/dentora-appointment`. It reports success only when the final response confirms that both emails finished. A published workflow and connected Gmail credentials are required. If a step fails, inspect the latest failed execution in n8n before retrying; the clinic email may already have been sent even if the patient email failed. The free Render demo may sleep when inactive.

WhatsApp is intentionally not part of this workflow.
