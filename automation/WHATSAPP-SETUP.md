# Appointment WhatsApp notifications

The appointment workflow sends clinic and patient email first, then sends the clinic alert and patient receipt using WaAPI. WhatsApp requests have a 25-second timeout, do not automatically retry, and cannot turn a successful email request into an error. The response reports API acceptance separately from email success; acceptance does not guarantee device delivery.

Set `WAAPI_API_TOKEN` and `WAAPI_INSTANCE_ID` privately in the Render Environment settings. The linked WaAPI instance must report `ready`. Credentials never belong in workflow exports or GitHub. The clinic alert recipient is `+923196982582`.

The website requires a WhatsApp number and shows the appointment-update notice beside Submit. Submitting the form acknowledges email and WhatsApp updates; there is no separate checkbox. Pakistani local mobile numbers are converted from `03…` to `+923…`; other numbers must include their country code. The workflow validates the normalized number before sending email.

The patient receives a receipt, preferred date/time and, when a note exists, the same courteous reply prepared for the email. Only the clinic can confirm the appointment. Inbound chatbot replies and automatic opt-out processing are not implemented in this notification workflow; the clinic contact is included for help and opt-out requests.

Do not bulk-retry a failed form submission: an email or a WhatsApp message might already have been accepted. Check the reported statuses and the WaAPI instance first. Automatic retries are disabled to avoid uncertain duplicate sends.

The Render startup migration updates only the known appointment workflow, preserves its connected Gmail credential references, and publishes the new definition. A non-matching workflow structure is left for manual review.
