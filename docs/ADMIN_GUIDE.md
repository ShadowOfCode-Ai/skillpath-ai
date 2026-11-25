# Admin Guide

## Becoming an Administrator

1. **Google Account Integration**:
   - The user account `gootymahind@gmail.com` is automatically recognized as an administrator by the server and `firestore.rules`.
2. **Database Marker Document**:
   - To grant admin access to additional accounts, create a document at `admins/{uid}` in Cloud Firestore.
3. **Simulated Preview Mode**:
   - On the Sign In page, clicking **Test Admin Console (gootymahind@gmail.com)** immediately boots staff privileges in the local preview.

## Administrative Functions

### 1. Opportunities Management
- Navigate to **Admin Console → Opportunities**.
- Click **Add Real Opportunity** to post actual corporate listings (requires Title, Company, Location, Work Mode, Required Skills, and Application URL).
- Archive old or filled listings by clicking **Archive**.

### 2. Sample Listings Toggle
- Use the **Show Sample Fictional Listings** toggle to hide demo vacancies so only verified company positions are shown to candidates.

### 3. Running System Check (SC01 – SC12)
- Navigate to **Admin Console → System Check**.
- Click **Run All (SC01 - SC12)** to execute the diagnostic test suite live.
- Each test displays millisecond execution duration and passing status.
