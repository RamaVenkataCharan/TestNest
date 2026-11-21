# TestNest — Comprehensive Repository Audit & Gap Analysis

**Date:** 22 November 2026  
**Auditor:** Senior Full-Stack Architect, AI Engineer, Database Engineer & AppSec Reviewer  
**Target Platform:** TestNest Single-Institution Examination & Continuous Learning Platform  
**Target Concurrency:** 500 – 2,000 Concurrent Candidates  
**Repository Inspected:** `AI-Exam-Proctoring-System` (React 19 + FastAPI + PostgreSQL + OpenCV/MediaPipe/YOLO)

---

## 1. Executive Summary of Audit

An exhaustive technical, architectural, and security audit of the existing repository was conducted prior to any code modification. 

The repository represents an early-stage prototype designed primarily for a single candidate demonstrating AI proctoring concepts on a developer workstation. While the user interface displays polished styling and dashboards, the underlying system architecture suffers from **fundamental concurrency bottlenecks, critical security vulnerabilities, severe data contamination flaws, and complete absence of enterprise exam resilience**.

### Critical Audit Findings
1. **Catastrophic Concurrency Collisions:** The backend utilizes process-wide Python global variables (`current_attempt.current_attempt_id`, `suspicious_score`, `suspicious_events`, `event_flags`) to track examination state. When a second student starts an exam, the first student's state is overwritten and their suspicious score is wiped. Concurrency for even **2 simultaneous students is broken**, let alone 2,000.
2. **Critical Security Vulnerabilities:**
   - **Open Privilege Escalation:** The public registration endpoint (`POST /users/register`) accepts a `role` string directly from the client payload. Any user can register as an `admin`.
   - **Direct Answer Key Leakage:** The endpoint `GET /questions/` is accessible to any authenticated student and serializes the complete `QuestionResponse` schema, including the plaintext `correct_answer`. A student can inspect HTTP responses to obtain 100% of exam answer keys.
   - **Broken Object Level Authorization (BOLA) & Unauthenticated Data Leaks:** Sensitive routes including `/student-performance/`, `/reports/exam/{attempt_id}`, and `/ai-events/` lack authentication or authorization checks, exposing student grades and proctoring logs publicly.
3. **Severe Data Contamination in Reports:** The PDF generation logic (`app/routers/pdf_reports.py`) executes an unconstrained `db.query(AIEvent).all()`, summing all violations from every student across the platform into every individual student's report.
4. **Zero Answer Durability (100% Answer Loss Risk):** In-progress exam answers are stored exclusively in React client memory (`useState`). There is no periodic autosaving, no incremental delta persistence, and no idempotency keys. Any browser refresh, crash, or transient network hiccup results in irreversible answer loss.
5. **Client-Authoritative Timers:** Exam countdowns are governed solely by client-side JavaScript (`useState(300)`). The database stores no start time (`started_at`) or expiration time (`expires_at`), allowing timer manipulation or indefinite restarts upon page refresh.
6. **Architectural AI Bottleneck:** The frontend captures canvas screenshots at high frequency and POSTs them to `/proctor/analyze-frame`, which decodes JPEG bytes and runs synchronous CPU-intensive MediaPipe FaceMesh and YOLO inference in the main FastAPI request thread. At 2,000 users, this yields 2,000 multipart image POSTs/sec, causing immediate server death.
7. **Legal & Licensing Risks:** Ultralytics YOLOv8 is distributed under **AGPL-3.0** (or proprietary enterprise license). The repository itself contains no standard open-source license.

---

## 2. In-Depth Component Audit

### 2.1 Backend Architecture & API Layer
- **Framework:** FastAPI `0.139.2` with Uvicorn `0.51.0` running SQLAlchemy `2.0.51` on Python.
- **Startup Side Effects:** `Base.metadata.create_all(bind=engine)` is executed synchronously on module load in `app/main.py`. This prevents safe horizontal scaling, introduces cold-start latency, and risks schema race conditions across worker processes.
- **Database Migrations:** While `alembic==1.18.5` is listed in `requirements.txt`, no Alembic environment (`alembic.ini` or migration scripts) exists in the repository. Schema management relies entirely on `create_all()`.
- **WebSocket Implementation (`app/routers/websocket.py` & `app/ai/websocket_manager.py`):**
  - Maintains an in-memory list `active_connections = []`.
  - No connection authentication or JWT verification is performed on the WebSocket handshake.
  - No session, attempt, or exam scoping exists. A violation detected on any student triggers a broadcast to *all* connected WebSockets, broadcasting one student's face count and suspicious score to every connected client (including other students and admins).
  - Incapable of scaling beyond a single worker process (multi-worker Uvicorn or multi-container deployments fail without a Redis pub/sub broker).
- **Service Layer & Routing Redundancies:** Several routers duplicate queries and logic (e.g., `analytics.py`, `dashboard_analytics.py`, `advanced_analytics.py`, `ai_reports.py`, `ai_event_report.py`).

### 2.2 Database Model Audit (`app/models/`)
The existing schema comprises only 7 tables: `users`, `exams`, `questions`, `exam_attempts`, `student_answers`, `ai_events`, and `ai_status`.

| Existing Table | Columns | Audit Assessment & Deficiencies |
| :--- | :--- | :--- |
| `users` | `id`, `full_name`, `email`, `password`, `role`, `is_active` | Flat role string (`admin`/`student`). No department, cohort, batch, academic year, student ID, MFA, or audit fields. |
| `exams` | `id`, `title`, `subject`, `description`, `duration`, `total_marks`, `created_at` | No scheduling (`opens_at`, `closes_at`), no lifecycle state (`draft`, `scheduled`, `published`, `closed`), no policy JSON (negative marking, shuffle, accommodations), no versioning. |
| `questions` | `id`, `exam_id`, `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer` | Hardcoded 4-option MCQ only. No support for multiple answers, coding challenges, descriptive questions, rubrics, tags, difficulty, marks-per-question, or versioning. |
| `exam_attempts` | `id`, `student_id`, `exam_id`, `score`, `submitted_at` | **Critical omission:** No `started_at`, no `expires_at`, no status (`in_progress`, `submitted`, `expired`, `disqualified`). Duration cannot be verified server-side. |
| `student_answers` | `id`, `attempt_id`, `question_id`, `selected_answer` | Only stores a single character `A-D`. No support for coding text, descriptive answers, attachments, revisions, or submission timestamps. |
| `ai_events` | `id`, `attempt_id`, `event`, `points`, `created_at` | Weak string event type. No severity classification, no reviewer status, no evidence reference (snapshot URL/hash), no human review disposition. |
| `ai_status` | `id`, `face_count`, `eye_status`, `head_status`, `phone_detected`, `suspicious_score`, `latest_event` | **Anti-Pattern:** Single global singleton table without `student_id` or `attempt_id`. All students overwrite this single row. |

### 2.3 Authentication & Authorization (`app/auth/`)
- **Password Security:** Uses `passlib.context.CryptContext(schemes=["bcrypt"])` and `python-jose` for JWT tokens. Passwords are hashed properly, but no complexity rules, MFA, or rate limiting are enforced on `/users/login`.
- **JWT Implementation:** Tokens carry `id`, `sub` (email), and `role`. Tokens have an expiration time but lack token revocation/blacklisting capabilities.
- **RBAC Flaws:**
  - Role checks are rudimentary (`current_user["role"] != "admin"`).
  - No granular scopes, permissions, or multi-role capabilities.
  - Faculty, proctor, and organizer roles do not exist.
  - Registration vulnerability: `POST /users/register` accepts `user.role` verbatim.

### 2.4 Examination & Autosave Engine
- **Attempt Start:** `POST /attempts/start` simply inserts an `ExamAttempt` row and calls `reset_score()` and `current_attempt.current_attempt_id = attempt.id`, corrupting state for any active concurrent user.
- **Answer Persistence:** There is **no autosave endpoint**. The server only receives answers during final submission (`POST /attempts/submit`).
- **Grading Logic:** Basic synchronous evaluation comparing uppercase option letters. No negative marking, no partial credits, no coding execution, no descriptive grading.
- **Review Exposure:** `GET /attempts/review/{attempt_id}` displays correct answers immediately after submission without checking exam publication policy or closure status.

### 2.5 AI Proctoring Implementation (`app/ai/`)
- **On-Server Frame Processing (`app/routers/proctor.py` & `app/ai/proctor_engine.py`):**
  - Clients send base64/JPEG payloads to `/proctor/analyze-frame`.
  - Server decodes image via `cv2.imdecode` and executes MediaPipe Face Detection, Face Mesh (landmark tracking), and YOLOv8 object detection sequentially.
  - High memory footprint: PyTorch + Ultralytics YOLOv8 loaded on worker nodes.
- **Desktop Artifacts in Server Code:**
  - `app/ai/camera.py`: Uses `cv2.VideoCapture(0)` and `cv2.imshow()`, which crashes on headless Linux servers.
  - `app/ai/audio_detector.py`: Uses `sounddevice.rec()` to record the *server's physical microphone*.
  - `app/ai/screen_monitor.py`: Uses `psutil.process_iter()` to search for `obs64.exe` running on the *server OS*. (Additionally, `psutil` is missing from `requirements.txt`).
- **Automated Disciplinary Failure:** If suspicious score reaches 100 points, or if 3 tab switches occur, the frontend and backend automatically terminate the exam. This violates PRD requirements separating integrity risk from academic assessment and mandating human review.

### 2.6 Frontend Implementation (`frontend/src/`)
- **Stack:** React `19.2.7`, Vite `8.1.1`, Material UI `9.3.1` (prerelease beta), Recharts `3.10.1`, React Router DOM `7.18.1`.
- **State Management:** Relies entirely on localized `useState` and `useRef` across colossal component files (`TakeExam.jsx` is 2,604 lines; `AIReports.jsx` is 2,240 lines; `AttemptDetails.jsx` is 1,748 lines; `AdminDashboard.jsx` is 1,111 lines).
- **Exam Workspace (`TakeExam.jsx`):**
  - Answers stored in `const [answers, setAnswers] = useState({})`.
  - Zero local storage or IndexedDB backup; zero server autosave.
  - Timer maintained by simple `setInterval`.
  - Video stream captured via canvas to JPEG blob every 1,000 ms and uploaded.
- **Accessibility:** Lacks keyboard shortcuts for option navigation, lacks ARIA landmark attributes, and displays interactive charts without tabular data fallbacks.

---

## 3. Security, Vulnerability & Scalability Assessment

### 3.1 Security Vulnerabilities (OWASP Top 10 Mapping)
1. **Broken Access Control (A01:2021) — Privilege Escalation:**
   - Path: `POST /users/register`
   - Issue: Parameter tampering on `role` field grants instant administrator privileges.
2. **Identification and Authentication Failures (A07:2021) — Answer Key Exposure:**
   - Path: `GET /questions/` and `GET /questions/{question_id}`
   - Issue: Accessible to candidates during exams; returns plaintext `correct_answer`.
3. **Broken Object Level Authorization (BOLA / A01:2021):**
   - Path: `POST /proctor/violation`
   - Issue: Accepts arbitrary `attempt_id` without verifying that the authenticated caller owns the attempt.
4. **Security Misconfiguration & Information Disclosure (A05:2021):**
   - Routes `/student-performance/`, `/reports/exam/{attempt_id}`, and `/ai-events/` have no authentication guard, leaking institution student lists and grades to unauthenticated internet traffic.
5. **CORS Misconfiguration:** Default fallback allows `http://localhost:5173` without strict institutional domain enforcement.

### 3.2 Concurrency & Scalability Bottlenecks (500 – 2,000 Target)
1. **Module Singleton Collisions:** Process globals in `backend/app/ai/current_attempt.py` and `suspicious_score.py` cause race conditions and state corruption under any concurrency $> 1$.
2. **Synchronous Frame Inference:** Ingesting 2,000 FPS of raw/JPEG video on the backend requires $\sim 2,000 \times 30\text{ ms} = 60\text{ seconds}$ of CPU compute every single second. Server thread pools will queue indefinitely, dropping requests and crashing the API within 10 seconds.
3. **Unbounded In-Memory WebSockets:** Single-process WebSocket list with full broadcasts on every violation will choke on $O(N^2)$ socket writes.
4. **Missing Database Indexes & Connection Pooling:**
   - No composite indexes on `(exam_id, student_id)`, `(attempt_id, question_id)`, or `(session_id, occurred_at)`.
   - N+1 query patterns in `student_performance.py` and `ranking.py`.

---

## 4. Licenses & Third-Party Dependency Audit

| Dependency / Component | Current Version | License Type | Commercial / Educational Compliance Assessment |
| :--- | :--- | :--- | :--- |
| **TestNest Project Code** | N/A | **No License File** | The repository contains no formal license (README states educational/portfolio only). Must establish institution-approved proprietary/commercial license terms. |
| **Ultralytics (YOLOv8)** | `8.4.105` | **AGPL-3.0 / Commercial** | **HIGH RISK:** AGPL-3.0 mandates that any service interacting over a network must provide complete source code under AGPL-3.0. Must be replaced with an Apache/MIT model (e.g., MediaPipe Objectron, TensorFlow Lite, or ONNX Runtime model) or run as an isolated independent microservice under separate licensing. |
| **MediaPipe** | `0.10.14` | Apache 2.0 | Fully compliant for institutional and commercial deployment. |
| **OpenCV Python** | `5.0.0.93` | Apache 2.0 | Fully compliant. |
| **FastAPI / Starlette** | `0.139.2` | MIT | Fully compliant. |
| **SQLAlchemy** | `2.0.51` | MIT | Fully compliant. |
| **psycopg2-binary** | `2.9.12` | LGPL-3.0 with exception | Compliant for binary usage; recommendation to transition to `asyncpg` or `psycopg3` for async performance. |
| **ReportLab** | `5.0.0` | BSD | Open-source version compliant for standard PDF generation. |
| **SoundDevice** | `0.5.5` | MIT | Host-dependent; not functional on server. Should be removed from backend. |
| **React / React-DOM** | `19.2.7` | MIT | Fully compliant. |
| **MUI Material** | `9.3.1` (Beta) | MIT | Prerelease software. Recommend stabilizing to stable MUI v5/v6 to avoid breaking beta changes. |
| **Recharts** | `3.10.1` | MIT | Fully compliant. |

---

## 5. Gap Analysis (TestNest Requirements vs Existing Code)

Below is the definitive evaluation of all 14 core TestNest requirements against the current codebase:

| # | TestNest Requirement | Current Implementation Status | Gap & Required Modifications |
| :- | :--- | :--- | :--- |
| **1** | **Multi-Role Governance** (Student, Faculty, Organizer, Admin) | **Incomplete (Broken)** | Only `admin` and `student` exist. Open registration allows self-escalation to admin. Faculty and Organizer/Proctor roles are completely missing. Scoped permissions missing. |
| **2** | **Cohort Management** (Dept, Program, Year, Section, Batch) | **Missing (0%)** | Zero cohort tables or relationships. All exams are global. No batch-level assignment, CSV bulk import, student ID validation, or transfer tracking. |
| **3** | **Mixed Exam Types** (MCQ, Coding, Descriptive, Mixed) | **Incomplete (MCQ Only)** | Only single-answer 4-option MCQs supported. Coding questions, test cases, sandboxes, descriptive prompts, file uploads, and rubrics are completely absent. |
| **4** | **Server-Authoritative Timing & Scheduling** | **Missing (0%)** | Timers are purely client-side React state. Exams lack `opens_at`/`closes_at`; attempts lack `started_at`/`expires_at`. Late entry and accommodation rules are missing. |
| **5** | **Reliable Answer Autosave & Recovery** | **Missing (0%)** | Zero autosave during exams. Answers exist only in browser memory until final submit. No monotonically increasing revisions, no idempotency keys, no disconnect recovery. |
| **6** | **AI Webcam & Browser Monitoring** | **Incomplete & Unscalable** | Face count, head pose, eye tracking exist but execute synchronously on the server via image uploads. Sound/screen monitor inspects host server. Must move inference on-device (client-side MediaPipe/TF.js) and report lightweight events. |
| **7** | **Human-Reviewed Integrity Incidents** | **Missing (0%)** | Automated termination triggers on arbitrary scores without human review. No proctor incident queue, reviewer outcomes (dismissed/escalated/confirmed), rationale logging, or appeals. |
| **8** | **Daily Tasks & Recurring Weekly Assessments** | **Missing (0%)** | Zero support for recurring schedules, task assignments, deadline windows, submission streaks, or question pool generation. |
| **9** | **Student Progress & Skill Mastery Profiles** | **Incomplete** | Basic attempt history table exists. Learning outcome proficiency, topic mastery graphs, longitudinal improvement trends, and intervention tracking are absent. |
| **10** | **Live Organizer / Proctor Monitoring** | **Incomplete & Unscalable** | Single-status dashboard displays global data over unauthenticated WebSocket. No candidate grid, connection health, prioritized alerts, or search/filter by batch. |
| **11** | **PDF and Excel Report Generation** | **Incomplete & Buggy** | ReportLab PDF script exists but aggregates all database events across all students into every report. Excel export is missing (CSV only). Background worker generation missing. |
| **12** | **Secure Isolated Coding Execution** | **Missing (0%)** | Zero coding execution architecture. No Monaco editor, no compilation queue, no sandbox runner (Docker/gVisor/nsjail), no execution quotas or security limits. |
| **13** | **2,000 Concurrent Session Scale** | **Failing (0%)** | Backend fails at $>1$ user due to process global state. Synchronous image uploads saturate CPU immediately. Redis caching, background queues, and connection pooling are missing. |
| **14** | **Privacy, Retention, Audit & Accessibility** | **Missing (0%)** | No retention policy or deletion jobs. Sensitive webcam images processed without signed storage. Audit logging table is missing. WCAG 2.2 AA accessibility target not met. |

---

## 6. Audit Conclusion & Strategic Recommendation

The existing code contains valuable React UI components, styling themes, and standalone MediaPipe/OpenCV logic. However, the core business engine, database schema, proctoring pipeline, and authentication are structurally incapable of serving 500 to 2,000 candidates safely.

**Key Recommendation:**
1. **Preserve & Modernize Reusable Assets:** Retain the frontend UI layout foundations, CSS themes, and dashboard component visuals. Modernize them with clean TypeScript interfaces, state decoupling, and responsive accessibility.
2. **Refactor Proctoring to Client-Side Edge Inference:** Migrate face and head tracking to client-side browser execution via MediaPipe JavaScript/Wasm. The browser will transmit only compact, cryptographically signed telemetry events ($\le 1\text{ KB}$) and periodic visual evidence thumbnails, eliminating the $2,000\text{ FPS}$ backend compute crisis.
3. **Rebuild the Core Engine with Modern Standards:** Implement an enterprise PostgreSQL schema with Alembic migrations, Redis queueing, server-authoritative attempt state machines, and an idempotent autosave protocol.
4. **Enforce Human-in-the-Loop Integrity:** Decouple AI flags from automatic failure; direct all flagged events into an organizer incident triage queue.
