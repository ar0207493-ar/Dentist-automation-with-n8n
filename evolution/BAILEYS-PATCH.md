# Pairing compatibility patch

The pinned Evolution 2.3.7 image uses Baileys `7.0.0-rc.9`. Logs from the failed phone pairing include `Invalid buffer` in `link_code_companion_reg` handling. A generated code alone does not establish that the WhatsApp device registration completed.

The build applies a narrow adaptation of the reviewed changes proposed in [Evolution PR #2727](https://github.com/evolution-foundation/evolution-api/pull/2727), commit `dffeac4fe2bf67855deb4881a4a492588f2b70d7`, drawing from [Baileys PR #2602](https://github.com/WhiskeySockets/Baileys/pull/2602) and [PR #2765](https://github.com/WhiskeySockets/Baileys/pull/2765):

- Ignore the phone registration notification variant that omits the crypto fields; process the subsequent full registration payload normally.
- Handle `companion_reg_refresh` on unregistered QR sessions by rotating the ADV secret and rendering the same ref again. Do not spend an additional QR ref or change registered/pending phone-code secrets.

This is an unmerged upstream compatibility fix adapted to the existing pinned package, **not a dependency upgrade**. No unrelated package versions or npm lifecycle scripts change. The build fails if the expected package version or source blocks differ, and syntax-checks the patched files. Keep the existing Baileys license and the included MIT notice. Re-review and remove this adaptation when upgrading to an official release containing these fixes.

The phone-code request additionally waits up to 15 seconds for WhatsApp's IQ acknowledgement, using the library's existing `query` and error validation. A rejected request clears its pending code and logs only the status code; it never exposes a plausible-looking but unaccepted code. Within a single socket, QR rotations reuse an accepted code instead of silently replacing it. Requesting a fresh code from the manager closes the unpaired socket first, so it starts a new registration. These acknowledgement/cache changes are Dentora adaptations and are covered by local mocked protocol tests.

Successful device linking must still be confirmed by live state `open` after approval on the user's phone. Do not infer it from code generation or run message tests automatically.
