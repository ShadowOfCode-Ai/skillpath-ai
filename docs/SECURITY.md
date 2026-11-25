# Security & Access Control Review

## 1. Firestore Rules Line-by-Line Breakdown

The active `firestore.rules` file enforces zero-trust attribute-based access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny-all catchall
    match /{document=**} {
      allow read, write: if false;
    }
```
- **Catch-all deny**: Any path not explicitly matched is strictly inaccessible.

### User Profiles (`users/{userId}`)
```javascript
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow create: if isOwner(userId) && isValidId(userId);
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId) || isAdmin();
```
- A user can only access their own profile. Admin override exists for administrative user assistance.

### Resume & Assessments Protection
```javascript
match /resume/{docId} {
  allow read: if isOwner(userId) || isAdmin();
  allow write: if false; // Server-only writes to protect verified integrity
}

match /assessments/{assessmentId} {
  allow read: if isOwner(userId) || isAdmin();
  allow write: if false; // Server-only writes to prevent answer forging
}
```
- **Integrity Guarantee**: Client SDKs can read their own resume and assessment results, but are mathematically blocked from writing or mutating them directly. Writes occur strictly through trusted backend APIs.

### Opportunities & Settings
```javascript
match /opportunities/{opportunityId} {
  allow read: if isSignedIn();
  allow write: if isAdmin();
}

match /settings/{settingId} {
  allow read: if isSignedIn();
  allow write: if isAdmin();
}
```
- Authenticated candidates can read vacancies and global settings; only authenticated administrators can create, update, or archive listings.

---

## 2. Server-Side Answer Key Protection

- The complete question bank (`server/data/questions.ts`) containing `correctIndex` and `explanation` is maintained solely on the server.
- The `POST /api/assessments` endpoint strips `correctIndex` and `explanation` before sending question options to the browser.
- Grading occurs exclusively in `POST /api/assessments/:id/submit`. Explanations and answer evaluations are only returned after submission has been received and locked.

---

## 3. Rate Limiting

- `POST /api/assessments` limits submissions to a maximum of 5 attempts per user per 24 hours to prevent brute-force answer fishing and encourage structured learning.
