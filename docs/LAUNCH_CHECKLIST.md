# Launch Checklist & Publish Readiness

## Verification Checks

| Check | Requirement | Status | Evidence |
|---|---|---|---|
| **SC01 - SC12** | All 12 deterministic test fixtures PASS | **PASS** | `npx tsx --test tests/systemCheck.test.ts` (0 failures) |
| **Firestore Rules** | Deny-all catchall, server-only write locks | **PASS** | `firestore.rules` deployed via DeployRules RPC |
| **Answer Key Protection** | No answers or explanations in `/api/assessments` | **PASS** | Stripped before transmission; verified in `server/api.ts` |
| **Zero Machine Learning Black Boxes** | TF-IDF & Cosine Similarity deterministic | **PASS** | Implemented cleanly in `src/engine/tfidf.ts` |
| **Sample Listings Labeling** | Obvious "Sample listing — not a real vacancy" | **PASS** | Badges and banners active across `OpportunitiesPage` |
| **No Invented Logos or Certs** | No fake corporate partnerships or testimonials | **PASS** | Generated company-initial avatars and honest disclaimers |
| **SEO & Social Sharing** | Open Graph, meta description, and favicon | **PASS** | Synced in `index.html` and `public/robots.txt` |
| **Production Build** | `npm run build` succeeds without TS errors | **PASS** | Verified via `compile_applet` and `lint_applet` |
| **Port & Host** | Server listens on 0.0.0.0 and PORT | **PASS** | Configured in `server.ts` |
