# SIKAP Mobile Application (`sikap`)

**Sistema para sa Impormal na Kasanayan at Aktibong Pangkabuhayan (SIKAP)** — Expo (SDK 57) / React Native TypeScript mobile app connecting informal workers and employers across Sorsogon Province.

---

## Core Capabilities & Recent System Behavior

- **Onboarding & Age Eligibility (18–90)**:
  - Registration (`RegisterStep2Screen`) and profile editing (`EditProfileScreen`) enforce ages **18 to 90 years old** via shared helpers in `src/utils/dateFormat.ts` (`MIN_USER_AGE = 18`, `MAX_USER_AGE = 90`).
  - Android uses `DateTimePicker` in `spinner` mode bounded to 18–90 years ago so older birth years (such as `1948`) are directly selectable without calendar paging friction.
- **Dual-Role Accounts & Progressive Data Disclosure**:
  - Users can switch between **Worker** and **Employer** personas with role-isolated reputation scores and 4-stage hiring/contact disclosure (`pending` -> `pending_negotiation` -> `employer_confirmed` -> `accepted` -> `completed`).
  - Supports bilingual English and Tagalog UI (`src/locales/en.ts`, `src/locales/tl.ts`), in-app negotiation action cards, and real-time Gemini chat translation.
- **Schedule-Conflict Protection & Tiered Job Completion**:
  - **Single-Active-Hired-Job Guard**: Workers are prevented from applying to or accepting a job whose scheduled date range (`schedule_date` to `expected_end_date`) overlaps with an already-accepted active job (`422 schedule_conflict`). Completing a multi-day job early immediately frees up the remaining calendar dates.
  - **Tiered Completion & Early Multi-Day Auditing** (`MarkCompleteScreen` & `ActionCard`): Jobs cannot be marked complete before their scheduled start date (`job_not_started`; employers are directed to use *Cancel Hire* instead). When an employer ends a multi-day job before its scheduled end date, they must select an explicit early-completion reason (`finished_early`, `mutual_agreement`, or `terminated`) and may attach an optional note, which is recorded in the backend `ActivityLog`.
- **4-Category Post-Job Reviews & Bayesian Reputation**:
  - Within a **7-day rating window** after completion, parties submit 4 role-specific 1–5 star ratings plus required written feedback:
    - **Employer → Worker** (`RateWorkerScreen`): *Quality of work*, *Punctuality*, *Communication*, *Behavior*.
    - **Worker → Employer** (`RateEmployerScreen`): *Clarity of job description*, *Fairness of pay*, *Respectfulness*, *Reliability*.
  - Profiles display the backend **Bayesian weighted reputation score** (`m = 3, C = 4.00` for `v >= 1`; accounts with `0` reviews show no rating yet rather than a `4.00` starting score).
- **Verified SIKAP Work History & Employer Public Job Posts**:
  - **Worker Profiles** (`WorkerPublicProfileScreen` and `ProfileScreen`) display a read-only, non-deletable **Verified SIKAP Work History** card (up to 5 recent completed jobs showing title, category, municipality, completion month/year, and rating received—with no employer PII or agreed price).
  - **Employer Public Profiles** (`EmployerPublicProfileScreen`) display a **Job Posts** card (up to 5 `open` / `completed` posts; tapping an `Open` post navigates to `JobDetails`, while `Completed` posts stay read-only).
  - Profile cards refresh promptly via `staleTime: 0`, `refetchOnMount: 'always'`, and React Query invalidations in `src/hooks/useJobs.ts` and `src/services/realtime.ts`.

---

## Quick Start

```bash
npm install
# Configure EXPO_PUBLIC_API_URL in .env (or use eas.json build profiles)
npm start
```

### Useful Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm test            # jest
```

### Building a Preview Android APK (EAS)

```bash
npx eas build --platform android --profile preview
```
