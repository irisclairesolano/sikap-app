# AI_CONTEXT.md — SIKAP Frontend
> Paste this file at the start of every AI coding session.
> Last updated: April 2026

---

## 1. PROJECT OVERVIEW

**SIKAP** — Sorsogon Informal Workers' Kabuhayan, Application, and Posting Portal
A mobile app connecting informal workers with employers in Sorsogon, Philippines.

**Two user roles: Worker and Employer.** Both share the same app — role is set at registration.

---

## 2. FRONTEND STACK

| Layer | Choice |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Server state | React Query (TanStack Query v5) |
| Auth storage | `expo-secure-store` (store Bearer token) |
| Forms | `react-hook-form` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Image picker | `expo-image-picker` |
| File upload | `expo-document-picker` |

### DO NOT
- Do not use class components
- Do not use Redux
- Do not use inline styles — use StyleSheet.create()
- Do not use fetch() directly — use the `apiClient` from `src/api/client.ts`
- Do not hardcode the base URL anywhere except `src/api/client.ts`
- Do not use React Navigation v5 patterns
- Do not store auth token in AsyncStorage — use expo-secure-store

---

## 3. DESIGN SYSTEM

From the Figma wireframes:

| Token | Value |
|---|---|
| Primary (Teal) | `#0D9488` |
| Primary Dark | `#0F766E` |
| Primary Light | `#CCFBF1` |
| Primary BG | `#F0FDFA` |
| Text Primary | `#1C1917` |
| Text Secondary | `#78716C` |
| Border | `#E7E5E4` |
| Success | `#16A34A` |
| Warning | `#D97706` |
| Error | `#DC2626` |
| Star/Rating | `#FBBF24` |
| White | `#FFFFFF` |
| Font | DM Sans |

**Status badge colors:**
- `pending` → amber bg `#FEF3C7`, text `#D97706`
- `accepted` / `completed` → green bg `#DCFCE7`, text `#16A34A`
- `rejected` / `withdrawn` → red bg `#FEE2E2`, text `#DC2626`
- `pending_negotiation` / `employer_confirmed` → teal bg `#CCFBF1`, text `#0D9488`

**No logo yet** — use a text-based wordmark "SIKAP" in teal on splash/auth screens.

---

## 4. API — BASE URL & AUTH

```
Production base URL: https://your-app.onrender.com/api/v1
Development base URL: http://localhost:8000/api/v1
```

Set in: `EXPO_PUBLIC_API_URL` env var.

### API Client pattern (`src/api/client.ts`)
```ts
// All API calls must go through this client — never use fetch() directly
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await SecureStore.getItemAsync('auth_token');
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}
```

### Auth token
- Stored in `expo-secure-store` under key `'auth_token'`
- Injected automatically by `apiClient`
- On logout: delete `'auth_token'` from SecureStore and reset navigation to Login

---

## 5. ALL API ENDPOINTS

### Auth (no token required)
```
POST /auth/register          Body: { name, email, password, password_confirmation, role, phone, barangay, municipality }
POST /auth/login             Body: { email, password } → { token, token_type, user }
POST /auth/verify-otp        Body: { user_id, otp }
POST /auth/resend-otp        Body: { user_id }
POST /auth/upload-id         Multipart: { id_photo } (requires token)
```

### Profile (token required)
```
GET    /profile
PUT    /profile              Body: { name, phone, barangay, municipality, bio? }
POST   /profile/skills       Body: { skill_ids: number[] }
POST   /profile/experiences  Body: { job_title, employer_name, duration, description }
DELETE /profile/experiences/{id}
POST   /profile/references   Body: { name, phone, relationship }
DELETE /profile/references/{id}
```

### Jobs (token required)
```
GET  /jobs              Query: ?category=&municipality=&barangay=&search=&page=
GET  /jobs/{id}
POST /jobs              [employer] Body: { title, description, category, barangay, municipality, slots, compensation, duration_type }
PATCH /jobs/{id}        [employer]
DELETE /jobs/{id}       [employer]
PATCH /jobs/{id}/complete      [employer]
GET  /my-jobs           [employer] — employer's own job posts
```

### Applications (token required)
```
POST  /jobs/{id}/apply          [worker]  Body: { cover_note? }
GET   /my-applications          [worker]
DELETE /applications/{id}       [worker]  — withdraw
PATCH /applications/{id}/accept [worker]
PATCH /applications/{id}/reject [worker]
POST  /jobs/{id}/flag-offline   [worker]

GET   /jobs/{id}/applications         [employer]
PATCH /applications/{id}/job-request  [employer] — Stage 2: send job request
PATCH /applications/{id}/confirm      [employer] Body: { final_agreed_price } — Stage 3
PATCH /applications/{id}/cancel-hire  [employer]
GET   /applications/{id}/contact      [employer] — get revealed worker contact
```

### Reviews & Reports (token required)
```
POST /applications/{id}/review  Body: { cat1, cat2, cat3, cat4, overall_rating, comment }
POST /reports                   Body: { reportable_type, reportable_id, type, description }
```

---

## 6. RESPONSE SHAPES

### Success
```json
{ "data": { ... }, "message": "ok" }
```

### Error
```json
{ "message": "Unauthorized", "errors": { "field": ["message"] } }
```

### Paginated lists
```json
{ "data": [...], "total": 42, "current_page": 1, "per_page": 15 }
```

---

## 7. KEY DATA MODELS

### User
```ts
{
  id: number
  name: string
  email: string          // NEVER shown to other users
  role: 'worker' | 'employer' | 'admin'
  phone: string          // Only revealed at Stage 4 (contact_revealed=true)
  barangay: string
  municipality: string
  document_url: string | null
  verification_status: 'pending' | 'approved' | 'rejected' | 'correction_needed'
  verification_badge: boolean
  is_suspended: boolean
  reputation_score: number
}
```

### JobPost
```ts
{
  id: number
  reference_number: string        // e.g. "SIKAP-2025-00042"
  title: string
  description: string
  category: string
  barangay: string
  municipality: string
  compensation: number
  slots: number
  accepted_count: number
  duration_type: string
  status: 'open' | 'closed_in_progress' | 'completed' | 'cancelled'
  rating_window_expires_at: string | null
  employer: User
}
```

### Application
```ts
{
  id: number
  job_post_id: number
  status: 'pending' | 'pending_negotiation' | 'employer_confirmed' | 'accepted' | 'rejected' | 'withdrawn' | 'completed'
  cover_note: string | null
  applied_at: string
  final_agreed_price: number | null   // only at employer_confirmed or accepted
  references_revealed: boolean        // true at Stage 2
  contact_revealed: boolean           // true at Stage 4
  worker: {
    id: number
    name: string
    barangay: string
    reputation_score: number
    verification_badge: boolean
    skills: string[]
    experiences: WorkerExperience[]
    character_references: CharacterReference[] | null   // null if not yet revealed
    phone: string | null                                 // null if not yet revealed
    email: null                                          // ALWAYS null — never shown
  }
}
```

---

## 8. APPLICATION WORKFLOW (4 STAGES)

This is the core of the app. Every UI decision around applications follows this flow:

```
Stage 1 → Worker applies          status: pending
           Worker submits application with optional cover note.
           Employer sees applicant but character refs + phone are hidden.

Stage 2 → Employer sends request  status: pending_negotiation
           Employer expresses interest. Character references AND phone number
           are revealed so both parties can communicate outside the app.

Stage 3 → Employer confirms hire  status: employer_confirmed
           Employer locks in the job with a final agreed price.
           Final price is now visible to the worker.

Stage 4 → Worker accepts hire     status: accepted   ← FINAL HIRE
           Worker formally accepts the offer. Job is now in progress.
           → Job runs
           → Job marked complete  status: completed  (7-day review window opens)
```

**What gets revealed at each stage:**
| Info | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
|---|---|---|---|---|
| Character references | ❌ Hidden | ✅ Revealed | ✅ Revealed | ✅ Revealed |
| Worker phone | ❌ Hidden | ✅ Revealed | ✅ Revealed | ✅ Revealed |
| Final agreed price | ❌ Hidden | ❌ Hidden | ✅ Revealed | ✅ Revealed |
| Worker email | ❌ Never | ❌ Never | ❌ Never | ❌ Never |

**Privacy rules to enforce in UI:**
- Never display worker email to anyone, ever
- Show `character_references` only when `references_revealed === true` (Stage 2+)
- Show worker `phone` only when `contact_revealed === true` (Stage 2+)
- Show `final_agreed_price` only when status is `employer_confirmed` or `accepted` (Stage 3+)
- Stage 4 accept button = "Accept Hire" — this is the final confirmation, make the language clear

---

## 9. FOLDER STRUCTURE

```
src/
├── api/
│   ├── client.ts              ← single API client (never bypass this)
│   ├── auth.ts
│   ├── jobs.ts
│   ├── applications.ts
│   ├── profile.ts
│   └── reviews.ts
├── components/
│   ├── common/                ← Button, Input, Badge, Card, Avatar, EmptyState, LoadingSpinner
│   ├── jobs/                  ← JobCard, JobStatusBadge
│   └── applications/          ← ApplicationCard, StageBar, PrivacyLockedInfo
├── screens/
│   ├── auth/
│   ├── worker/
│   ├── employer/
│   └── shared/
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── WorkerNavigator.tsx
│   └── EmployerNavigator.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useJobs.ts
│   └── useApplications.ts
├── store/
│   └── authStore.ts           ← user object + token state
├── theme/
│   └── colors.ts              ← all design tokens
└── types/
    └── index.ts               ← User, JobPost, Application, etc.
```

---

## 10. SCREENS INVENTORY

### AUTH — Shared
| Screen ID | Screen Name | Key API Call |
|---|---|---|
| W-01 | Splash | none — check SecureStore for token |
| W-02 | Onboarding 1 | none |
| W-02B | Onboarding 2 | none |
| W-02C | Onboarding 3 | none |
| W-03 | Role Select | none — sets role for registration |
| W-04 | Registration | `POST /auth/register` |
| W-05 | OTP Verify | `POST /auth/verify-otp` |
| W-06 | ID Upload | `POST /auth/upload-id` |
| W-07 | Pending Verify | none — polling or static wait screen |
| W-08 | Login | `POST /auth/login` |
| W-09 | Forgot Password | (not yet in backend) |

### WORKER REGISTRATION — 3-Step Flow
| Screen | Screen Name | Notes |
|---|---|---|
| Reg Step 1 | Basic Info | name, phone, barangay, municipality |
| Reg Step 2 | Skills Selection | searchable skill picker, multi-select |
| Reg Step 3 | Experience, References & ID | work history + character refs + gov ID upload |
| — | Edit / Add Skills | `POST /profile/skills` |

### WORKER — Main App
| Screen ID | Screen Name | Key API Call |
|---|---|---|
| W-10 | Home Feed | `GET /jobs` |
| W-11 | Job Search | `GET /jobs?search=&category=` |
| W-12 | Job Details | `GET /jobs/{id}` |
| W-13 | Apply | `POST /jobs/{id}/apply` |
| W-14 | My Applications | `GET /my-applications` |
| W-15 | Application Detail — Stage 1 (Pending) | show cover note, locked info |
| W-16 | Application Detail — Stage 2 (Negotiation) | refs revealed |
| W-17 | Application Detail — Stage 3 (Offer) | price revealed, accept/reject |
| W-18 | Accept Modal | `PATCH /applications/{id}/accept` |
| W-19 | Hire Receipt | show final_agreed_price + job info |
| W-20 | Worker Profile | `GET /profile` |
| W-26 | Reviews | reviews received |
| W-27 | Rate Employer | `POST /applications/{id}/review` |
| W-28 | Report | `POST /reports` |
| W-29 | Notifications | (local or push — TBD) |

### WORKER — Application Detail Full Journey
| Screen | Screen Name | Notes |
|---|---|---|
| App Detail Pending | Just Applied | stage bar at step 1, locked employer info |
| App Detail Hired | In Progress | stage bar complete, phone revealed |
| App Detail Completed | Rate / Report / Receipt | review prompt, 7-day window |

### WORKER — Post-Hire Status Screens
| Screen | Notes |
|---|---|
| Receipt Downloaded ✓ | success state |
| Report Form (Offline Hire) | `POST /reports` |
| Rate Employer (Full Screen) | `POST /applications/{id}/review` |
| Application Sent ✓ | success state after apply |
| Application Withdrawn | `DELETE /applications/{id}` |
| Offer Rejected | after `PATCH /applications/{id}/reject` |
| Rating Submitted ✓ | success state |
| Job Completed (Worker) | final state |
| Report Submitted ✓ | success state |

### WORKER — Profile, Skills, History, References
| Screen ID | Screen Name | Key API Call |
|---|---|---|
| W-23 | Work History List | `GET /profile` |
| W-24 | Add Work History | `POST /profile/experiences` |
| W-25 | Character References | `POST /profile/references` |
| — | Confirm Hire Modal | `PATCH /applications/{id}/accept` |
| — | Pre-Report Selection | pick report type before form |
| — | Employer Profile (Rate View) | public employer profile |
| — | Settings | logout, account options |
| — | Edit Profile | `PUT /profile` |

### WORKER — Edit Profile, Ratings, Switch Account
| Screen | Notes |
|---|---|
| Worker Edit Profile (Full) | `PUT /profile` |
| Worker View My Ratings | reviews received |
| Worker Switch to Employer | re-registration flow |

### EMPLOYER LOGIN & REGISTRATION
| Screen | Notes |
|---|---|
| Employer Login | `POST /auth/login` |
| Employer Reg Step 1 — Basic Info | `POST /auth/register` with role=employer |
| Employer Reg Step 2 — Employer Type | individual / company / barangay |
| Employer Reg Step 3 — Document Uploads | `POST /auth/upload-id` |
| Employer OTP Verification | `POST /auth/verify-otp` |
| Employer Pending Verification | wait screen |
| E-23 Edit Employer Profile | `PUT /profile` |

### EMPLOYER — Main App
| Screen ID | Screen Name | Key API Call |
|---|---|---|
| E-10 | Employer Home | `GET /my-jobs` |
| E-11 | Post a Job | `POST /jobs` |
| E-13 | View Applicants | `GET /jobs/{id}/applications` |
| E-15 | Send Request | `PATCH /applications/{id}/job-request` |
| E-17 | Confirm Hire | `PATCH /applications/{id}/confirm` + final_agreed_price |
| E-18 | Cancel Hire | `PATCH /applications/{id}/cancel-hire` |
| E-19 | Stage 4 Accepted | show accepted worker + revealed phone |
| E-20 | Mark Complete | `PATCH /jobs/{id}/complete` |
| E-22 | Employer Profile | `GET /profile` |
| E-25 | Rate Worker | `POST /applications/{id}/review` |
| E-27 | Notifications | TBD |

### EMPLOYER — Applicant & Job Management
| Screen ID | Screen Name | Notes |
|---|---|---|
| E-12 | My Posted Jobs | list with status badges |
| E-14 | Applicant Profile — Stage 1 (Locked) | no refs, no phone |
| E-16 | Applicant Profile — Stage 2 (Revealed) | refs shown after job-request |
| E-21 | Job Status Management | open / close / complete |
| — | Employer App Detail Stage 1 | received application |
| — | Employer App Detail Stage 2 | request sent |
| — | Employer App Detail Stage 3 | offer sent |
| — | Employer App Detail Stage 4 | hired / in progress |
| — | Employer App Detail Completed | rate / receipt |

### EMPLOYER — Additional
| Screen | Notes |
|---|---|
| E · My Jobs List | alternate job list view |
| E · Worker Profile (Rate View) | `POST /applications/{id}/review` |
| E · Job Completion | success state |
| E · Edit Profile | `PUT /profile` |
| E · Settings | logout |
| E · Pre-Report Selection | report type picker |
| Employer Edit Profile (Full) | full form |
| Employer View My Ratings | reviews received |

---

## 11. REACT QUERY PATTERNS

### Query keys convention
```ts
// Always use arrays so invalidation is predictable
['jobs']                         // job list
['jobs', id]                     // single job
['applications']                 // my applications
['applications', id]             // single application
['profile']                      // current user profile
```

### Mutation pattern
```ts
const mutation = useMutation({
  mutationFn: (data) => apiClient('/jobs/{id}/apply', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    navigation.navigate('ApplicationSent');
  },
  onError: (err) => {
    // Show inline error — never use Alert.alert() for API errors
  }
});
```

---

## 12. NAVIGATION STRUCTURE

```
RootNavigator
├── AuthNavigator (Stack) — shown when no token
│   ├── Splash
│   ├── Onboarding
│   ├── RoleSelect
│   ├── Register
│   ├── Login
│   ├── OTPVerify
│   ├── IDUpload
│   └── PendingVerify
│
├── WorkerNavigator (Bottom Tabs)
│   ├── Home (W-10)
│   ├── Search (W-11)
│   ├── My Applications (W-14)
│   ├── Profile (W-20)
│   └── [Stack screens pushed on tab stacks]
│
└── EmployerNavigator (Bottom Tabs)
    ├── Home (E-10)
    ├── My Jobs (E-12)
    ├── Notifications (E-27)
    └── Profile (E-22)
```

**After login:** check `user.role` → navigate to `WorkerNavigator` or `EmployerNavigator`.
**After login:** check `user.verification_status` → if `pending`, navigate to `PendingVerify` regardless of role.

---

## 13. BUSINESS RULES TO ENFORCE IN UI

- Max 50 applications per job — show "Applications full" on job details if reached
- One application per worker per job — hide Apply button if already applied
- Reviews only allowed within 7 days of completion — check `rating_window_expires_at`
- Worker phone: only render when `contact_revealed === true`
- Worker character references: only render when `references_revealed === true`
- `final_agreed_price`: only render when status is `employer_confirmed` or `accepted`
- Worker email: never display, never request — not in any UI

---

## 14. ERROR HANDLING CONVENTIONS

- API errors → show inline below the form or in a banner at top of screen
- Never use `Alert.alert()` for API errors
- Network errors → show a retry button
- 401 → clear token from SecureStore + navigate to Login
- 403 → show "You don't have permission" inline
- 422 → show field-level validation errors from `error.errors`

---

## 15. ENVIRONMENT VARIABLES

```env
EXPO_PUBLIC_API_URL=https://your-app.onrender.com/api/v1
```

For local dev:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 16. PROGRESS TRACKER

> Update this every session. Paste the updated version into the next session.

### Auth Screens
- [ ] Splash (W-01)
- [ ] Onboarding 1-3 (W-02 to W-02C)
- [ ] Role Select (W-03)
- [ ] Registration (W-04)
- [ ] OTP Verify (W-05)
- [ ] ID Upload (W-06)
- [ ] Pending Verify (W-07)
- [ ] Login (W-08)

### Worker Screens
- [ ] Home Feed (W-10)
- [ ] Job Search (W-11)
- [ ] Job Details (W-12)
- [ ] Apply (W-13)
- [ ] My Applications (W-14)
- [ ] Application Detail — Stage 1 (W-15)
- [ ] Application Detail — Stage 2 (W-16)
- [ ] Application Detail — Stage 3 Offer (W-17)
- [ ] Accept Modal (W-18)
- [ ] Hire Receipt (W-19)
- [ ] Worker Profile (W-20)
- [ ] Work History List (W-23)
- [ ] Add Work History (W-24)
- [ ] Character References (W-25)
- [ ] Reviews (W-26)
- [ ] Rate Employer (W-27)
- [ ] Report (W-28)
- [ ] Notifications (W-29)
- [ ] Edit Profile (Full)
- [ ] Settings

### Employer Screens
- [ ] Employer Login / Registration
- [ ] Employer Home (E-10)
- [ ] Post a Job (E-11)
- [ ] My Posted Jobs (E-12)
- [ ] View Applicants (E-13)
- [ ] Applicant Profile Stage 1 (E-14)
- [ ] Send Request (E-15)
- [ ] Applicant Profile Stage 2 (E-16)
- [ ] Confirm Hire (E-17)
- [ ] Cancel Hire (E-18)
- [ ] Stage 4 Accepted (E-19)
- [ ] Mark Complete (E-20)
- [ ] Job Status Management (E-21)
- [ ] Employer Profile (E-22)
- [ ] Edit Employer Profile (E-23)
- [ ] Rate Worker (E-25)
- [ ] Notifications (E-27)
- [ ] Settings

### Shared / Components
- [ ] apiClient (src/api/client.ts)
- [ ] Auth token storage (SecureStore)
- [ ] Navigation skeleton (all navigators)
- [ ] Theme / colors.ts
- [ ] Common components (Button, Input, Badge, Card)
- [ ] StageBar component
- [ ] JobCard component
- [ ] ApplicationCard component
