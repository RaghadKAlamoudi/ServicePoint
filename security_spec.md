# Security Specification: ServicePoint Booking Platform

## 1. Data Invariants
- **Identity Integrity:** A user cannot create or modify a profile that doesn't belong to their UID.
- **Role Locking:** Users cannot self-assign the `admin` role. The `admin` role is strictly derived from a trusted server-side list or a dedicated `admins` collection.
- **Relational Integrity:** A booking cannot exist without a valid `userId` pointing to the authenticated user.
- **Booking Immutability:** Once a booking's status is `Completed` or `Cancelled`, it should be locked from further modifications (except by admins).
- **Service Integrity:** Only admins can modify the catalog of services and categories.

## 2. The "Dirty Dozen" (Attack Vectors)
1. **The Role Escalator:** An authenticated user attempts to update their own role to `admin`.
2. **The Booking Scraper:** A user attempts to list all bookings in the system without an admin flag.
3. **The ID Poisoner:** A user attempts to create a booking with a 2MB string as an ID or a null `userId`.
4. **The Ghost Wallet:** A user attempts to update their `walletBalance` directly.
5. **The Impersonator:** A user attempts to create a booking for another user's `userId`.
6. **The Snapshot Hijacker:** A user attempts to update a booking's `totalPrice` after it has been created to bypass payment.
7. **The Status Skipper:** A user attempts to set a booking directly to `Completed` without a transition.
8. **The Category Infiltrator:** A non-admin user attempts to create a new service category.
9. **The PII Blanket Read:** A user attempts to read another user's profile which contains PII.
10. **The Timestamp Faker:** A user attempts to set a manual `timestamp` instead of using the server's time.
11. **The Relational Orphan:** A user attempts to create a booking for a service ID that doesn't exist.
12. **The Inventory Exhaustion:** A user attempts to flood the system with 10,000 tiny bookings.

## 3. Deployment Strategy
- Implement strict `isValid[Entity]` helpers for every collection.
- Use `request.auth.uid` validation for all user-owned data.
- Enforce relational querying for `bookings` collection.
- Add a terminal state check for bookings.
