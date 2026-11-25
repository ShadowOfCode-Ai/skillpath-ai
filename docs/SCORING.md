# Scoring Methodology & Mathematical Specifications

All scoring in SkillPath AI is deterministic, mathematically explainable, and reproducible by hand without machine learning black boxes.

## 1. Skill Verification Statuses

| Status | Verification Condition | Credit | Evidence Label |
|---|---|---|---|
| **VERIFIED** | Assessed with score ≥ 60% | 1.0 (100%) | "Resume + assessment" or "Assessment only" |
| **DEVELOPING** | Assessed with score < 60% | 0.5 (50%) | "Resume + assessment" or "Assessment only" |
| **UNVERIFIED** | Claimed in resume or added manually, no assessment | 0.25 (25%) | "Resume only" or "Added by you" |
| **NOT_FOUND** | Required by role, no evidence on profile | 0.0 (0%) | "No evidence" |

*Invariant*: A resume alone NEVER grants VERIFIED status. Passing an objective assessment is mandatory.

---

## 2. Shared Skill Match Formula

Used for both career recommendation and opportunity alignment:

$$\text{skillMatch} = \left( \frac{\sum (\text{weight}_i \times \text{credit}_i)}{\sum \text{weight}_i} \right) \times 100$$

- Core skill importance weight = 2
- Supporting skill importance weight = 1

**Fixture**:
- 5 core skills required: 4 Verified (1.0), 1 Not Found (0.0).
- $\text{Total weight} = 5 \times 2 = 10$.
- $\text{Weighted credit} = (4 \times 1.0 + 1 \times 0.0) \times 2 = 8$.
- $\text{skillMatch} = \frac{8}{10} \times 100 = 80.0\%$.

---

## 3. Career Recommendation Score

$$\text{careerScore} = 0.70 \times \text{skillMatch} + 0.30 \times \text{assessmentConfidence}$$

Where:
- $\text{assessmentConfidence}$ is the weighted average score of all required skills that have been formally assessed (0 if none).
- $\text{evidenceCoverage} = \frac{\text{assessedRequiredSkills}}{\text{totalRequiredSkills}}$.
- Labeled **Provisional** if $\text{evidenceCoverage} < 0.40$.

---

## 4. Opportunity Match Score

$$\text{opportunityScore} = 0.70 \times \text{skillMatch} + 0.30 \times \text{textSimilarityPercent}$$

Where:
- $\text{textSimilarityPercent} = \text{cosineSimilarity}(\mathbf{vec}_{\text{candidate}}, \mathbf{vec}_{\text{opp}}) \times 100$.
- TF-IDF uses unigram + bigram tokens, stopword filtering, smoothed IDF $\ln((1+N)/(1+df)) + 1$, sublinear TF $1 + \ln(tf)$, and L2-normalization.
