# EcoSmartX Security & Invariants Specification

## 1. Data Invariants
1. **Ownership Invariant**: All documents in `/facilities/{facilityId}` and `/energy_events/{eventId}` must strictly have an `ownerId` matching `request.auth.uid`.
2. **Identity Integrity**: Users cannot forge or modify the `ownerId` upon creation or update (`incoming().ownerId == request.auth.uid` and `incoming().ownerId == existing().ownerId`).
3. **Temporal Invariant**: Creation and update timestamps must be verified with `request.time`.
4. **Length and Type Boundaries**: All text fields have enforced max lengths (`name.size() <= 100`, `title.size() <= 150`, IDs matching `^[a-zA-Z0-9_-]+$`).
5. **No Blanket Reads**: List queries must explicitly verify `resource.data.ownerId == request.auth.uid`.

## 2. Dirty Dozen Payloads (Designed to Fail)
1. **Payload 1 (Identity Spoofing - Create)**: User creates facility with `ownerId: 'victim-uid-999'`. (Expected: PERMISSION_DENIED)
2. **Payload 2 (Unauthenticated Write)**: Unauthenticated request attempting to create an event. (Expected: PERMISSION_DENIED)
3. **Payload 3 (Unverified Email Write)**: Request with `email_verified: false` attempting to mutate sensitive facilities. (Expected: PERMISSION_DENIED)
4. **Payload 4 (Owner Hijacking - Update)**: User attempts to modify `ownerId` to someone else in existing facility. (Expected: PERMISSION_DENIED)
5. **Payload 5 (Resource Poisoning - Huge Name)**: Facility with `name` exceeding 100 characters (>100KB string attack). (Expected: PERMISSION_DENIED)
6. **Payload 6 (Shadow Field Injection)**: Creating facility with unexpected ghost field `isAdmin: true` or `maliciousScript: '<script>'`. (Expected: PERMISSION_DENIED)
7. **Payload 7 (Path Injection)**: Document ID containing non-alphanumeric characters like `../../admin/escalate`. (Expected: PERMISSION_DENIED)
8. **Payload 8 (Blanket Collection Scraping)**: Reading `/facilities` without filtering `ownerId == request.auth.uid`. (Expected: PERMISSION_DENIED)
9. **Payload 9 (Cross-User Event Read)**: User B attempts to read User A's private energy event `/energy_events/event-a`. (Expected: PERMISSION_DENIED)
10. **Payload 10 (Terminal State Alteration)**: Attempting to reactivate a 'cancelled' or 'completed' event without permission. (Expected: PERMISSION_DENIED)
11. **Payload 11 (Vampire Negative Load)**: Setting negative energy values or invalid data types (`targetReductionKw: -9999` or `'not-a-number'`). (Expected: PERMISSION_DENIED)
12. **Payload 12 (Foreign Calendar Event Tamper)**: Updating `calendarEventId` on an event owned by another user. (Expected: PERMISSION_DENIED)

## 3. Test Runner
Included in `test/firestore.rules.test.ts` testing unit rules logic.
