# SkillPath AI

> **“Verify your skills. Find your path.”**

SkillPath AI helps students, graduates, and early-career professionals prove what they can actually do. It combines two distinct forms of evidence — what a resume claims and what an objective assessment demonstrates — into an auditable, verified skill profile, paired with transparent skill-gap analysis, deterministic career recommendations, a personalized learning roadmap, and matched opportunities.

Every number and percentage on screen is reproducible by hand and backed by mathematical formulas.

---

## Key Features

1. **Dual Evidence Verification Model**:
   - **Claimed Evidence**: Extracted from resume text via strict token boundary dictionaries. Stays `UNVERIFIED` until demonstrated.
   - **Demonstrated Evidence**: Objective 4-question assessments per skill from a 65+ server-side question bank.
   - **Exact Statuses**:
     - `VERIFIED`: Assessed with score ≥ 60%. (Full 100% credit in matching formulas).
     - `DEVELOPING`: Assessed with score < 60%. (50% credit).
     - `UNVERIFIED`: Claimed on resume or added manually, not yet assessed. (25% credit).
     - `NOT_FOUND`: No evidence; required by role or job. (0% credit).

2. **Deterministic Career Recommendations & Gap Analysis**:
   - `skillMatch = (Σ(importanceWeight × credit) ÷ Σ(importanceWeight)) × 100` (Core weight: 2, Supporting weight: 1).
   - `careerScore = 0.70 × skillMatch + 0.30 × assessmentConfidence`.
   - Evidence coverage meter (provisional label if < 40%).
   - Interactive Radar Chart comparing role requirements against current assessed mastery.
   - 3 mutually exclusive gap buckets: Matched, Developing, Missing.

3. **TF-IDF Opportunity Matching**:
   - `opportunityScore = 0.70 × skillMatch + 0.30 × textSimilarity`.
   - Document similarity calculated via L2-normalized unigram/bigram TF-IDF cosine similarity.
   - Transparent formula breakdown card on every opportunity.
   - Clear sample listing badges and admin toggles.

4. **Personalized Step-by-Step Roadmap**:
   - Topological prerequisite ordering (e.g., Python before Pandas, ML before Deep Learning).
   - Milestones for unverified skills with recommended practice projects and effort estimates.
   - Concludes with two capstone milestones: *Build a portfolio project for this role* and *Re-verify your skills*.

5. **Diagnostic System Check (SC01 – SC12)**:
   - Built-in live test runner at `/admin/system-check` executing fixtures against pure TypeScript engines with millisecond timings and PASS/FAIL logs.

6. **Print-Ready Verification Report**:
   - Printable A4 summary with light theme forced in print and formal non-certification disclaimer.

---

## Architecture & Technology Stack

- **Client**: React 19, TypeScript, Tailwind CSS, React Router, Recharts, Lucide Icons.
- **Engines**: Pure, deterministic TypeScript modules located in `src/engine/` (`textTools`, `skillExtractor`, `assessmentScorer`, `verifier`, `gapAnalyzer`, `careerRanker`, `roadmapBuilder`, `tfidf`, `opportunityMatcher`, `explain`, `selfCheck`).
- **Server**: Node.js + Express backend running secure `/api/*` endpoints, rate limiting (max 5 assessment submissions per 24 hours), and server-only question bank.
- **Persistence & Security**: Firebase Cloud Firestore and Firebase Authentication with attribute-based access control rules (`firestore.rules`).

---

## Data Model (Firestore)

- `users/{uid}`: Profile details, degree, target role, preferences, consent timestamp.
- `users/{uid}/resume/current`: Extracted text (up to 60,000 chars), sections detected, contact signals, and detected skills. *The original uploaded file is never stored.*
- `users/{uid}/assessments/{id}`: Assessment questions, answers, and graded per-skill breakdowns.
- `users/{uid}/roadmap/{roleId}`: Milestone progress statuses (`not_started` | `in_progress` | `done`).
- `users/{uid}/saved/{opportunityId}`: Saved bookmarked opportunities.
- `opportunities/{id}`: Managed vacancy listings (`isSample: true` for fictional sample listings).
- `settings/app`: Application toggles (`showSampleListings`).
- `admins/{uid}`: Admin marker documents.

---

## How to Run & Develop Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start development server (Port 3000)
npm run dev

# 4. Production build
npm run build
npm start
```

---

## Known Limitations

- **Dictionary Extraction**: Skill extraction relies on alias dictionary matching with strict token boundaries. While it prevents false positives (e.g., 'C' in 'Cloud'), complex abbreviations or typos in unstructured resumes may not be identified.
- **Multiple-Choice Assessments**: Technical assessments test conceptual, algorithmic, and syntactic comprehension via 4 options; real-time in-browser code execution is not currently implemented.
- **Question Bank Expert Review**: Before high-stakes public hiring deployment, subject-matter experts should periodically audit the question bank.
- **Predictive Validity**: While ranking and match scores are mathematically exact and explainable, they have not yet been calibrated against empirical hiring decisions or recruiter hiring outcomes.

---

## Future Work (Planned Post-Launch)

- Semantic embedding vectors for unstructured project descriptions.
- In-browser sandbox coding environment for algorithmic coding challenges.
- Direct ATS and real-time job board webhook integrations.
- Verifiable W3C decentralized digital credentials (DID/VC).
