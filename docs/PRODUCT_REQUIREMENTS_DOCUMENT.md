# TestNest — Product Requirements Document (PRD)

**Scope:** Single Institution Examination & Continuous Learning Platform  
**Target Concurrency:** 500 – 2,000 Concurrent Candidates  
**Assessment Formats:** Multiple Choice (MCQ) + Coding Sandbox + Descriptive  
**Version:** 1.0 — 22 November 2026  

---

## 1. Executive Summary and Scope

TestNest provides one institution with a secure, auditable examination and continuous-learning environment. It manages student cohorts, daily assignments, recurring weekly tests, mixed-format examinations, AI-assisted incident detection, manual review, performance analytics and downloadable reports. The first release prioritizes reliable exam submission over advanced AI surveillance.

| Parameter | Baseline Target |
| :--- | :--- |
| **Deployment** | Single institution; departments, programs, years, sections and batches |
| **Concurrency** | 500–2,000 active exam attempts; proved by load test |
| **Exam Types** | MCQ, coding, descriptive and mixed assessments |
| **Clients** | Desktop-first browser; optional managed lockdown client later |
| **Privacy** | Minimal collection, explicit notices, access restrictions, retention limits |

---

## 2. Goals, Exclusions and Measurable Acceptance Criteria

1. **Reliable Submission:** Prevent answer loss during brief disconnects; server-authoritative attempt timing and idempotent submission.
2. **Cohort Tracking:** Enable batch-level assignment and individual progress reporting.
3. **Proctor Incident Queue:** Give proctors a live, actionable incident queue with evidence and reviewer outcomes.
4. **Academic/Integrity Separation:** Separate integrity risk from academic achievement; no automated failure based solely on model flags.
5. **Out of Scope for MVP:** Detecting devices outside webcam view, guaranteed OS lockdown via browser, AI-only disciplinary decisions, remote identity proofing without oversight.

| SLO / Quality Attribute | Acceptance Target |
| :--- | :--- |
| **Concurrent Attempts** | 2,000 active candidates in representative load test |
| **Answer Save Latency** | p95 < 500 ms at target load |
| **Exam API Availability** | 99.9% scheduled exam target |
| **Durability** | Zero acknowledged answers lost in failure tests |
| **Access Control** | No cross-role or cross-batch unauthorized access |
| **Disaster Recovery** | Resume to last acknowledged state; no extra time |
| **Accessibility** | WCAG 2.2 AA target; accommodations supported |

---

## 3. Actors, Permissions and Workflows

| Actor | Key Rights & Responsibilities |
| :--- | :--- |
| **Student** | Join assigned batches; take exams; submit tasks; view own published results |
| **Faculty** | Author question banks; assign tasks and evaluate assigned students |
| **Organizer / Proctor** | Schedule exams; monitor live sessions; review evidence; publish approved results |
| **Administrator** | Configure institution, roles, retention, security, backups and audit access |

### Core Workflows
1. **Enrollment:** Administrator imports CSV $\to$ validates unique student identifiers $\to$ assigns batches $\to$ invites users.
2. **Exam Creation:** Faculty builds versioned question set $\to$ organizer sets schedule, duration and policy $\to$ preview $\to$ publish.
3. **Attempt:** Eligibility check $\to$ device/permission checks $\to$ consent/notice $\to$ server starts attempt $\to$ autosave $\to$ submit/expiry.
4. **Review:** Proctor events enter queue $\to$ human inspects contextual evidence $\to$ marks dismissed/needs action/confirmed $\to$ appeal possible.
5. **Reports:** Scores and submissions feed analytics jobs $\to$ reports versioned $\to$ authorized users download.

---

## 4. Functional Requirements

### 4.1 Authentication and Cohort Management
- Institution email or managed student IDs; role-based access with MFA for staff.
- Departments $\to$ programs $\to$ academic years $\to$ sections; many-to-many student/batch membership.
- CSV enrollment with duplicate checks, deactivation, transfer history and bulk assignments.

### 4.2 Question Bank and Examination
- MCQ single/multiple answer, coding, descriptive; topic, difficulty, outcome, version and marks.
- Draft $\to$ scheduled $\to$ open $\to$ closed $\to$ grading $\to$ published; immutable published exam version.
- Server-side start/end, late entry, allowed attempts, section navigation, shuffle, negative marking and accommodations.
- Autosave answer revisions with monotonically increasing sequence and idempotency keys.
- Server-owned expiry and finalization; reconciliation of in-flight writes at timeout.

### 4.3 Coding Evaluation
- Monaco editor; language and version choices; sample and hidden tests.
- Ephemeral sandbox with strict CPU, memory, execution time, process, filesystem and network restrictions.
- Queue-based asynchronous judging; no untrusted code executed by API workers; deterministic score aggregation.

### 4.4 Descriptive Grading
- Text answers and restricted file attachments; rubric, markers and moderation.
- Optional AI feedback as draft only; grading changes audit logged and appealable.

### 4.5 Proctoring and Integrity
- Browser visibility, fullscreen, copy/paste and focus events logged with timestamps.
- Opt-in camera access, on-device face presence/multiple-face checks, optional visible-phone detection.
- Configurable warning severity; incident evidence minimization and manual disposition.
- No claim of identifying hidden devices, measuring mental focus or preventing OS-level app switching in browser.

### 4.6 Daily Tasks and Weekly Tests
- Assignment templates, recurring schedules, release/due windows, batch targeting and accommodations.
- Submissions, resubmissions, late policy, streaks and feedback.
- Weekly assessments generated from approved pools, with organizer review before publishing.

### 4.7 Analytics and Reporting
- Per-student score trends, mastery by learning outcome, task completion and improvement.
- Batch aggregate statistics with minimum cohort-size privacy rules.
- PDF/XLSX exports, report versions, background generation and access logs.

### 4.8 Notifications and Audit
- In-app/email reminders for exam opening, deadlines and publication.
- Append-only audit of exam changes, permissions, grade overrides and integrity decisions.
