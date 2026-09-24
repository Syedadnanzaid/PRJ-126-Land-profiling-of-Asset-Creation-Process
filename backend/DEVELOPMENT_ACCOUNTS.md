# Development Government Accounts

## Purpose
This project is architected for a future real Government SSO integration. The internal application roles (`VERIFICATION_OFFICER`, `APPROVING_AUTHORITY`) will eventually be mapped from trusted government identity claims. 

To prevent security risks and privilege escalation, the public registration endpoint strictly creates only `APPLICANT` users, and the frontend login/registration avoids any form of role selection. 

During MVP development, we require access to government functionality without building a fake SSO or compromising the production registration endpoint. To achieve this, we use a **backend database seed** to inject test accounts. 

---

## Seeded Development Accounts

| Role | Email | Password |
|---|---|---|
| `VERIFICATION_OFFICER` | `officer@gov.test` | `GovDev@123!` (or `$DEV_GOV_PASSWORD`) |
| `APPROVING_AUTHORITY` | `approver@gov.test` | `GovDev@123!` (or `$DEV_GOV_PASSWORD`) |

### How to Seed

Run the following command from the `backend/` directory:

```bash
npx prisma db seed
```
This script uses `upsert` and is completely idempotent. It is safe to run multiple times. It does not overwrite or delete actual users.

### How to Login

1. Start the backend and frontend.
2. Navigate to the login page (`/login`).
3. Enter the email (e.g., `officer@gov.test`) and the development password.
4. The system will securely issue a JWT with the appropriate trusted role, allowing access to government dashboards.

---

## ⚠️ SECURITY WARNING ⚠️
**These credentials are DEVELOPMENT ONLY.**
- **NEVER** deploy these plaintext passwords to a production environment.
- **NEVER** run the seed script in a production environment unless explicit production configuration overrides the passwords.
- Production environments must rely on the future Government SSO integration for government employee provisioning.
