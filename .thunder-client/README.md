# Grantora API test collection

The collection targets the existing Spring Boot routes under `http://localhost:8080/api`. It does not create, change, or delete database records until requests are run.

## Import and configure

1. Start the backend and its MySQL database.
2. In Thunder Client, import `.thunder-client/collection.json`.
3. Import `.thunder-client/environment.example.json` as an environment, set it active, and provide test account values locally. Do not commit credentials or tokens.
4. Enter an unused `beneficiaryEmail` and a password, then run **Register valid beneficiary** followed by **Login beneficiary**. Registration creates a persistent User record. The role-escalation test also creates a second user. Use only a disposable local database.
5. Configure existing Admin and Officer account emails/passwords. The backend registration service assigns the `BENEFICIARY` role regardless of the incoming `role`, so do not use public registration to create privileged test accounts.
6. Configure a second existing beneficiary if testing the separate-owner cases. Run both beneficiary login requests before profile requests.
7. Set distinct values for `missingFieldsEmail`, `invalidEmail`, `weakPasswordEmail`, `weakPassword`, `roleEscalationEmail`, `unknownEmail`, `incorrectPassword`, and `otherBeneficiaryId` before running their cases. Use a malformed email and deliberately weak password for their respective tests. Source inspection found no registration/profile input constraints, so invalid or weak registration tests may create users instead of rejecting them; run only on a disposable database. Create profile requests require first-time accounts; a repeated run will intentionally hit duplicate-create cases.
8. The `set-env-var` tests capture response `userId`, profile `id`, and JWT `token` into the active Thunder environment. Never export or commit an environment after it contains secrets.

`expiredToken` and `deleteCandidateBeneficiaryId` are intentionally blank. An expired JWT must be produced in an authorized test setup; the application signing secret is not included here. The expired-token request is not a meaningful expiry test unless `expiredToken` contains a genuinely expired, correctly signed token. Only run the Admin DELETE request against a disposable test profile. The API has no beneficiary-self-delete endpoint.

## Contract notes from source inspection

- `POST /api/auth/register` accepts `fullName`, `email`, `password`, `phone`, and `role`; `POST /api/auth/login` accepts `email` and `password`. Registration always stores the role as `BENEFICIARY`; the collection includes a role-escalation check.
- `POST /api/beneficiaries` and `PUT /api/beneficiaries/me` accept `dateOfBirth`, `annualIncome`, `address`, `state`, `district`, and `category`. The current profile controller derives the user from the JWT principal; the DTO has no beneficiary ID.
- `GET /api/beneficiaries/me` and `PUT /api/beneficiaries/me` operate on the authenticated principal's profile. `GET /api/beneficiaries/{id}`, `DELETE /api/beneficiaries/{id}`, and `GET /api/beneficiaries` are Admin-only in the controller.
- `GET /api/users` is Admin-only. `/` is the public health endpoint.
- Auth DTOs and beneficiary DTOs do not declare validation constraints. The controller does not use `@Valid` for these operations. The auth and profile services throw generic runtime exceptions for duplicate registration/profile cases, and no global exception handler was found. Consequently, validation/status assertions for malformed input and conflicts are intended checks that may expose implementation gaps, not claims about observed responses.
- The security configuration requires authentication for all `/api/beneficiaries/**` routes; Admin-only checks are in the controller for list/by-ID/delete. The `/me` create/read/update handlers derive identity from the authenticated email, but do not explicitly restrict those operations to the BENEFICIARY role.

## Execution record

Not executed: the local API at `http://localhost:8080` did not respond during preparation. No HTTP response status or result is reported as passed. Start the backend and database, then run the collection in Thunder Client to obtain actual results. Tests that require existing Admin/Officer accounts, a second beneficiary, or a signed expired token need those fixtures configured first.
