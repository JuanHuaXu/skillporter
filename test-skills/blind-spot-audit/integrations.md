---
name: blind-spot-audit/integrations
description: Tools for auditing trust boundaries with external APIs, webhooks, and services.
---

# External Integrations

Audit the "Soft Underbelly" of the system—the points where it connects to the outside world via APIs and Webhooks.

### audit_webhook_auth
Verify that incoming webhooks are authenticated.
**Action**: Check if the code validates signatures (e.g., `X-Hub-Signature`) or uses shared secrets.
**Risk**: Unauthenticated webhooks allow attackers to spoof external service events (e.g., "Payment Successful").

### check_outbound_trust
Audit logic that relies on the "Truth" of an external API.
**Action**: Find where the system calls an external API (e.g., GitHub, Stripe) and check if the response is validated.
**Risk**: If the external service is compromised or compromised via DNS hijacking, can it inject malicious data into your system?

### find_unvalidated_redirects
Audit "Success URLs" or "Callback URLs" provided in integration flows.
**Action**: Check if the system redirects to a URL provided by an external service without validating it against a whitelist.
