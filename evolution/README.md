# Dentora Evolution API — Render demo

Pinned upstream Evolution API 2.3.7, linux/amd64 image digest. Deploy as a separate free Docker web service in Singapore, with Dockerfile `evolution/Dockerfile` and build context `evolution`.

The wrapper creates a separate `dentora_evolution` database on the existing Render Postgres instance. It validates the target before migrations and refuses an n8n database. Sessions are stored in PostgreSQL; local cache is enabled instead of a separate Redis service for this small demo.

The build also applies a version-checked pairing compatibility patch to the existing Baileys package. See `BAILEYS-PATCH.md` for source attribution, the observed error, scope and removal conditions.

Secrets live only in Render environment settings: `DATABASE_ADMIN_URI`, `DATABASE_CONNECTION_URI`, `AUTHENTICATION_API_KEY`. Do not commit them, expose them in the website or print them in logs.

Render free services sleep and share the workspace's free-hour quota. The existing free Postgres instance expires 30 days after its creation. This setup is for demonstration, not guaranteed always-on delivery.

The Green API appointment workflow remains in use until a WhatsApp device is paired to Evolution and a provider switch is explicitly requested. No automatic message tests are included.

The manager includes **Link with phone number** beside its QR button. It accepts an international WhatsApp number and requests the existing Evolution pairing-code endpoint only when the user clicks **Get pairing code**. Enter the returned code in WhatsApp Business → Linked devices → Link a device → Link with phone number instead. The build patches only the pinned manager's pairing dialog and changes its asset filename to avoid stale browser caches. It fails if the expected upstream UI changes.

When the user requests a phone code, the manager checks live connection state first. It cancels a previous **unpaired** QR attempt before requesting the phone code. It refuses to reset a connection with a paired owner/profile and stops if the connection opens in the meantime. Closing the form cancels further polling. No instance, message or contact is deleted by the manager.
