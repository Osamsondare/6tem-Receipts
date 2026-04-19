# Security Specification for 6tem Receipts

## Data Invariants
1. A user can only access their own business profile and receipts.
2. Receipts must belong to an existing user profile (relational check disabled for now as the user doc might be created with first receipt, but ideally it exists).
3. All write operations must be performed by an authenticated user whose email is verified (if applicable, though standard set_up_firebase might not mandate it, I'll recommend it).
4. Timestamp fields (`createdAt`, `updatedAt`) must be set by the server.
5. All IDs must be valid alphanumeric strings.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a receipt for `user_A` while authenticated as `user_B`.
2. **Identity Spoofing**: Attempt to update another user's business profile.
3. **Identity Spoofing**: Attempt to read receipts of another user via a collection group query or direct ID access.
4. **State Shortcutting**: Attempt to manually increment `receiptCount` in the user doc without creating a receipt.
5. **Resource Poisoning**: Create a receipt with a 1MB string for `customerName`.
6. **Resource Poisoning**: Use a document ID containing malicious characters (e.g., `../passwd`).
7. **Bypass Verification**: Write data while `email_verified` is false (if enforced).
8. **Shadow Field injection**: Add `isAdmin: true` to a user profile.
9. **Negative Math**: Set `total` to a negative number.
10. **Zero-Price Poisoning**: Set `quantity` or `price` to a negative value or zero if unintended (though zero is allowed in my app).
11. **Timestamp Spoofing**: Manually set `createdAt` to a date in the past.
12. **Bulk Leak**: Attempt to list all receipts across all users (`match /{document=**}`).

## Test Plan
- Verify that all "Dirty Dozen" payloads return `PERMISSION_DENIED`.
- Verify that legitimate operations (Create profile, Create receipt, List own receipts) return `SUCCESS`.
