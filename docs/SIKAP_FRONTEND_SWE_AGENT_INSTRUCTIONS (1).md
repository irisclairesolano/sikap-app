# SIKAP Frontend — SWE Agent Instructions
> This file is for AI coding agents working on the SIKAP mobile frontend.
> Read this entire file before writing any code. Do not skip sections.
> Companion files: AI_CONTEXT.md (full project context), COLLABORATION.md (backend guide)

---

## HOW TO START EVERY SESSION — READ THIS FIRST

When the developer pastes this file into a new chat, you must do the following **automatically, without being asked**:

### Step 1 — Greet and confirm context
Reply with exactly this format:
```
✅ SIKAP Frontend Agent ready.

I've read the full instructions. Here's what I know:
- Stack: React Native + Expo SDK 54, React Navigation v6, React Query v5, react-hook-form
- API: [base URL from AI_CONTEXT.md]
- All calls through apiClient — no direct fetch()
- Token in expo-secure-store only
- No Alert.alert() for errors
- All styles via StyleSheet.create() + colors.ts

📋 Current progress: [read the progress tracker from AI_CONTEXT.md and list what is ✅ done and what is next]

👉 What would you like to build next?
   Or type: "next" and I'll start the next unchecked screen in the progress tracker.
```

### Step 2 — Wait for the developer to say what to build
The developer will either:
- Say **"next"** → you automatically pick the next unchecked item in the Section 16 progress tracker and build it
- Name a specific screen → you build that screen
- Describe a bug → you fix it using the bug fix protocol below

### Step 3 — Before writing any code, confirm the plan
Before generating code for any screen, output a short plan:
```
📐 Building: [ScreenName]
📁 File: src/screens/[worker|employer|auth]/[ScreenName].tsx
🔌 API: [endpoint from AI_CONTEXT.md]
🧩 Components needed: [list from common/ or jobs/ or applications/]
⚠️  Privacy checks needed: [yes/no — list which flags if yes]
```
Then ask: **"Confirm? (yes / adjust)"**
Only write code after the developer confirms.

### Step 4 — After delivering code
Always end your response with:
```
✅ Done. Next steps:
1. Copy this to [exact file path]
2. Run: npx expo start
3. Test: [specific things to tap/check on device]
4. If it works, run: git commit -m "feat: add [screen name] screen"
5. Update the progress tracker in AI_CONTEXT.md — tick off [ScreenName]
6. Come back and say "next" for the next screen.
```

---

## BUG FIX PROTOCOL

When the developer reports a bug, follow this format:

1. Ask for the file contents if not provided: *"Please paste the contents of [filename].tsx"*
2. Identify the exact issue — state it in one sentence
3. Show only the changed function/block — not the whole file unless necessary
4. End with: *"Replace lines X–Y in [filename] with the above. Do not change anything else."*

Never rewrite an entire file to fix a bug. Never restructure working code while fixing an unrelated issue.

---

## 0. WHAT YOU ARE BUILDING

**SIKAP** (Sorsogon Informal Workers' Kabuhayan, Application, and Posting Portal) is a React Native mobile app built with Expo SDK 54. It connects informal workers with employers in Sorsogon, Philippines.

There are two user roles — **Worker** and **Employer** — both in the same app. Role is set at registration and determines which navigator the user enters after login.

The backend is a deployed Laravel 12 REST API. You will never modify the backend. You only build the frontend that consumes it.

---

## 1. YOUR PRIME DIRECTIVES

These rules override everything else. Violating them will break the app.

1. **Never bypass `apiClient`.** All HTTP calls go through `src/api/client.ts`. Never use `fetch()` or `axios` directly in a screen or component.
2. **Never store the auth token in AsyncStorage.** Use `expo-secure-store` only, under the key `'auth_token'`.
3. **Never display a worker's email to any user, ever.** It is never in any response shape and must never appear in any UI.
4. **Never show character references or phone number before Stage 2.** Check `references_revealed` and `contact_revealed` flags — do not assume based on status string alone.
5. **Never use `Alert.alert()` for API errors.** Show all errors inline — below the form field or in a banner at the top of the screen.
6. **Never hardcode colors, spacing, or font sizes.** Use tokens from `src/theme/colors.ts` and a shared `spacing` constant.
7. **Never use inline styles.** Always use `StyleSheet.create()`.
8. **Never create a new file without checking if the correct folder already exists** in the structure defined in Section 4.

---

## 2. TECH STACK — EXACT VERSIONS

| Layer | Package | Notes |
|---|---|---|
| Framework | `expo` SDK 54 | Do not use Expo Router |
| Language | TypeScript | Strict mode |
| Navigation | `@react-navigation/native` v6 + `native-stack` + `bottom-tabs` | v6 only — do not use v5 patterns |
| Server state | `@tanstack/react-query` v5 | For all API calls |
| Forms | `react-hook-form` | For all form inputs |
| Auth storage | `expo-secure-store` | Token only |
| Icons | `@expo/vector-icons` (Ionicons) | No other icon library |
| Image picker | `expo-image-picker` | For profile photos |
| File upload | `expo-document-picker` | For government ID upload |
| Font | DM Sans via `expo-font` or `@expo-google-fonts/dm-sans` | |

---

## 3. DESIGN SYSTEM

### Colors (`src/theme/colors.ts`)
```ts
export const colors = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryLight: '#CCFBF1',
  primaryBg: '#F0FDFA',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  border: '#E7E5E4',
  white: '#FFFFFF',
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  star: '#FBBF24',
  backgroundPage: '#F5F5F4',
};
```

### Status Badge Colors
| Status | Background | Text |
|---|---|---|
| `pending` | `#FEF3C7` | `#D97706` |
| `pending_negotiation` | `#CCFBF1` | `#0D9488` |
| `employer_confirmed` | `#CCFBF1` | `#0D9488` |
| `accepted` / `completed` | `#DCFCE7` | `#16A34A` |
| `rejected` / `withdrawn` | `#FEE2E2` | `#DC2626` |

### Typography
- Font family: **DM Sans** throughout
- Do not mix font families
- Sizes: 12 (caption), 14 (body), 16 (body large / input), 18 (title), 22 (screen title), 28 (hero)

### Spacing
Use multiples of 4: `4, 8, 12, 16, 20, 24, 32, 40, 48`

### Logo
No logo asset exists yet. Use a text wordmark **"SIKAP"** in `colors.primary` (`#0D9488`) on auth and splash screens. Do not use a placeholder image.

---

## 4. FOLDER STRUCTURE

Always place files in the exact correct folder. Do not create new top-level folders.

```
src/
├── api/
│   ├── client.ts              ← THE only place fetch() is used
│   ├── auth.ts                ← auth API functions
│   ├── jobs.ts                ← job API functions
│   ├── applications.ts        ← application API functions
│   ├── profile.ts             ← profile API functions
│   └── reviews.ts             ← review + report API functions
│
├── components/
│   ├── common/
│   │   ├── Button.tsx         ← primary, secondary, outline, danger variants
│   │   ├── Input.tsx          ← with label, error state, helper text
│   │   ├── Badge.tsx          ← status badges using the color table above
│   │   ├── Card.tsx           ← white card with shadow and border radius
│   │   ├── Avatar.tsx         ← initials fallback (no logo yet)
│   │   ├── EmptyState.tsx     ← icon + title + subtitle + optional CTA
│   │   ├── LoadingSpinner.tsx ← centered ActivityIndicator in primary color
│   │   ├── ErrorBanner.tsx    ← inline top-of-screen error display
│   │   └── StageBar.tsx       ← 4-step progress bar for application workflow
│   ├── jobs/
│   │   ├── JobCard.tsx        ← used in home feed and search results
│   │   └── JobStatusBadge.tsx
│   └── applications/
│       ├── ApplicationCard.tsx
│       └── PrivacyLockedInfo.tsx  ← shows locked placeholder for unrevealed info
│
├── screens/
│   ├── auth/
│   │   ├── SplashScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── RoleSelectScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── OTPVerifyScreen.tsx
│   │   ├── IDUploadScreen.tsx
│   │   └── PendingVerifyScreen.tsx
│   ├── worker/
│   │   ├── HomeScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── JobDetailScreen.tsx
│   │   ├── ApplyScreen.tsx
│   │   ├── MyApplicationsScreen.tsx
│   │   ├── ApplicationDetailScreen.tsx  ← handles all 4 stages
│   │   ├── HireReceiptScreen.tsx
│   │   ├── WorkerProfileScreen.tsx
│   │   ├── EditProfileScreen.tsx
│   │   ├── WorkHistoryScreen.tsx
│   │   ├── AddWorkHistoryScreen.tsx
│   │   ├── CharacterReferencesScreen.tsx
│   │   ├── ReviewsScreen.tsx
│   │   ├── RateEmployerScreen.tsx
│   │   ├── ReportScreen.tsx
│   │   └── NotificationsScreen.tsx
│   └── employer/
│       ├── EmployerHomeScreen.tsx
│       ├── PostJobScreen.tsx
│       ├── MyJobsScreen.tsx
│       ├── ViewApplicantsScreen.tsx
│       ├── ApplicantDetailScreen.tsx    ← handles all 4 stages
│       ├── ConfirmHireScreen.tsx
│       ├── EmployerProfileScreen.tsx
│       ├── EditEmployerProfileScreen.tsx
│       ├── RateWorkerScreen.tsx
│       ├── EmployerReportScreen.tsx
│       └── EmployerNotificationsScreen.tsx
│
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── WorkerNavigator.tsx
│   └── EmployerNavigator.tsx
│
├── hooks/
│   ├── useAuth.ts             ← login, logout, token, current user
│   ├── useJobs.ts             ← useQuery wrappers for job endpoints
│   └── useApplications.ts    ← useQuery wrappers for application endpoints
│
├── store/
│   └── authStore.ts           ← user object in memory (not SecureStore)
│
├── theme/
│   └── colors.ts
│
└── types/
    └── index.ts               ← all TypeScript interfaces
```

---

## 5. API CLIENT

The `apiClient` function in `src/api/client.ts` is the only place in the entire codebase where HTTP requests are made.

```ts
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

  if (res.status === 401) {
    await SecureStore.deleteItemAsync('auth_token');
    // trigger navigation to Login — handled by RootNavigator auth state listener
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Something went wrong');
  }

  return res.json();
}
```

Each file in `src/api/` exports typed functions that call `apiClient`. Example:
```ts
// src/api/jobs.ts
export const getJobs = (params?: JobQueryParams) =>
  apiClient<PaginatedResponse<JobPost>>(`/jobs?${new URLSearchParams(params)}`);

export const getJobById = (id: number) =>
  apiClient<{ data: JobPost }>(`/jobs/${id}`);
```

---

## 6. REACT QUERY PATTERNS

### Query key conventions
```ts
['jobs']                    // job list
['jobs', id]                // single job
['my-applications']         // worker's applications
['applications', id]        // single application
['profile']                 // current user profile
['my-jobs']                 // employer's job posts
```

### Query pattern
```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['jobs'],
  queryFn: getJobs,
});
```

### Mutation pattern
```ts
const mutation = useMutation({
  mutationFn: (data: ApplyPayload) => applyToJob(jobId, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    navigation.navigate('ApplicationSent');
  },
  onError: (err: Error) => {
    setApiError(err.message); // show inline — never Alert.alert()
  },
});
```

### Loading and error states
- Always render a `<LoadingSpinner />` when `isLoading === true`
- Always render an `<ErrorBanner message={error.message} />` when there is an error
- Always render `<EmptyState />` when data exists but list is empty
- Never leave a screen blank with no feedback

---

## 7. NAVIGATION STRUCTURE

```
RootNavigator
├── AuthNavigator (Stack)
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
│   ├── Tab: Home → HomeScreen + JobDetailScreen + ApplyScreen (stack)
│   ├── Tab: Search → SearchScreen + JobDetailScreen (stack)
│   ├── Tab: Applications → MyApplicationsScreen + ApplicationDetailScreen (stack)
│   └── Tab: Profile → WorkerProfileScreen + EditProfileScreen + ... (stack)
│
└── EmployerNavigator (Bottom Tabs)
    ├── Tab: Home → EmployerHomeScreen + PostJobScreen (stack)
    ├── Tab: My Jobs → MyJobsScreen + ViewApplicantsScreen + ApplicantDetailScreen (stack)
    ├── Tab: Notifications → EmployerNotificationsScreen (stack)
    └── Tab: Profile → EmployerProfileScreen + EditEmployerProfileScreen (stack)
```

### Auth routing logic in RootNavigator
```ts
// On mount:
1. Check SecureStore for 'auth_token'
2. If no token → AuthNavigator
3. If token → GET /profile to validate + get user
4. If user.verification_status !== 'approved' → PendingVerify (inside AuthNavigator)
5. If user.role === 'worker' → WorkerNavigator
6. If user.role === 'employer' → EmployerNavigator
```

---

## 8. APPLICATION WORKFLOW — CRITICAL

This is the most important business logic in the app. Get this right before building any application-related screen.

```
Stage 1 → Worker applies
          status: pending
          Employer sees applicant name + reputation score only
          Character refs: HIDDEN | Phone: HIDDEN | Price: HIDDEN

Stage 2 → Employer sends job request
          status: pending_negotiation
          Character refs: REVEALED | Phone: REVEALED
          Both parties can now communicate outside the app
          Price: still HIDDEN

Stage 3 → Employer confirms hire with final price
          status: employer_confirmed
          Final agreed price: REVEALED to worker
          Worker sees "Accept Hire" or "Reject" buttons

Stage 4 → Worker accepts hire  ← FINAL HIRE
          status: accepted
          Job is now in progress
          → Job completes → status: completed
          → 7-day review window opens (check rating_window_expires_at)
```

### Privacy check helper — use this pattern in every application screen
```ts
const showRefs = application.references_revealed === true;
const showPhone = application.contact_revealed === true;
const showPrice = ['employer_confirmed', 'accepted', 'completed'].includes(application.status);
```

### StageBar component
Build a `<StageBar currentStage={1|2|3|4} />` component used on both worker and employer application detail screens. It shows 4 steps with labels: Applied → Shortlisted → Offer Sent → Hired.

---

## 9. FORMS

Use `react-hook-form` for all forms. Never use local `useState` to manage form field values.

```ts
const { control, handleSubmit, formState: { errors } } = useForm<RegisterPayload>();

// Field validation errors from the API (422) map to fields like:
// { errors: { email: ['The email has already been taken.'] } }
// Show these under the relevant input using the Input component's error prop
```

---

## 10. TYPESCRIPT INTERFACES

All types live in `src/types/index.ts`. Never define types inline in screen files.

Key interfaces to always reference:

```ts
type UserRole = 'worker' | 'employer' | 'admin';
type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'correction_needed';
type ApplicationStatus =
  | 'pending'
  | 'pending_negotiation'
  | 'employer_confirmed'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'completed';
type JobStatus = 'open' | 'closed_in_progress' | 'completed' | 'cancelled';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  barangay: string;
  municipality: string;
  document_url: string | null;
  verification_status: VerificationStatus;
  verification_badge: boolean;
  is_suspended: boolean;
  reputation_score: number;
}

interface JobPost {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  category: string;
  barangay: string;
  municipality: string;
  compensation: number;
  slots: number;
  accepted_count: number;
  duration_type: string;
  status: JobStatus;
  rating_window_expires_at: string | null;
  employer: User;
}

interface Application {
  id: number;
  job_post_id: number;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  final_agreed_price: number | null;
  references_revealed: boolean;
  contact_revealed: boolean;
  worker: WorkerPublicProfile;
  job_post: JobPost;
}

interface WorkerPublicProfile {
  id: number;
  name: string;
  barangay: string;
  reputation_score: number;
  verification_badge: boolean;
  skills: string[];
  experiences: WorkerExperience[];
  character_references: CharacterReference[] | null;
  phone: string | null;
  email: null; // always null — never render this
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
}
```

---

## 11. COMMON COMPONENT CONTRACTS

When building or consuming common components, follow these prop contracts exactly. Do not change them.

### `<Button />`
```ts
type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
};
```

### `<Input />`
```ts
type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};
```

### `<Badge />`
```ts
type BadgeProps = {
  status: ApplicationStatus | JobStatus;
  // Automatically picks the correct color from the status color table
};
```

### `<StageBar />`
```ts
type StageBarProps = {
  currentStage: 1 | 2 | 3 | 4;
};
```

### `<PrivacyLockedInfo />`
```ts
type PrivacyLockedInfoProps = {
  label: string; // e.g. "Character References"
  revealedAt: string; // e.g. "Stage 2 — after employer sends request"
};
// Shows a locked icon + label + "Available at [revealedAt]" message
```

---

## 12. SCREEN BUILDING RULES

When building any screen, follow this checklist:

- [ ] Screen is in the correct folder (`screens/worker/` or `screens/employer/` or `screens/auth/`)
- [ ] Screen is registered in the correct navigator
- [ ] API calls use a function from `src/api/` — not inline fetch
- [ ] Loading state is handled with `<LoadingSpinner />`
- [ ] Empty state is handled with `<EmptyState />`
- [ ] Error state is handled with `<ErrorBanner />`
- [ ] Forms use `react-hook-form`
- [ ] No inline styles — all `StyleSheet.create()`
- [ ] Colors from `colors.ts` only
- [ ] No `Alert.alert()` for errors
- [ ] Privacy flags checked before rendering worker contact/references/price
- [ ] TypeScript types used — no `any`

---

## 13. WHAT NOT TO DO

| ❌ Never do this | ✅ Do this instead |
|---|---|
| `fetch('/api/...')` directly in a screen | Use `apiClient` from `src/api/client.ts` |
| `AsyncStorage.setItem('token', ...)` | `SecureStore.setItemAsync('auth_token', ...)` |
| `Alert.alert('Error', err.message)` | `<ErrorBanner message={err.message} />` |
| `style={{ color: '#0D9488' }}` | `style={styles.text}` with `colors.primary` |
| Render `worker.email` anywhere | Never — it is always null and must not be shown |
| Render `worker.phone` unconditionally | Only when `contact_revealed === true` |
| Render `character_references` unconditionally | Only when `references_revealed === true` |
| Create a new screen outside `src/screens/` | Always inside the correct screens subfolder |
| Use Expo Router file conventions | This project uses React Navigation only |
| Use `any` type | Define the interface in `src/types/index.ts` |
| Import from `@react-navigation/stack` | Use `@react-navigation/native-stack` |

---

## 14. ENVIRONMENT

```env
EXPO_PUBLIC_API_URL=https://your-app.onrender.com/api/v1
```

For local development:
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Access in code: `process.env.EXPO_PUBLIC_API_URL` — never hardcode the URL.

---

## 15. COMMIT CONVENTIONS

Follow the same convention as the backend team:

```
feat: add worker home screen
feat: add job detail screen with apply button
fix: show privacy locked info on stage 1 application
fix: handle 401 in apiClient and redirect to login
chore: add common Button and Input components
refactor: extract StageBar into shared component
```

One screen or one fix per commit. Never bundle multiple screens into one commit.

---

## 16. PROGRESS TRACKER

Copy this into every new session and check off what's done.

### Foundation
- [ ] `src/theme/colors.ts`
- [ ] `src/types/index.ts`
- [ ] `src/api/client.ts`
- [ ] `App.tsx` with QueryClientProvider + NavigationContainer
- [ ] `RootNavigator.tsx` with auth check logic
- [ ] `AuthNavigator.tsx`
- [ ] `WorkerNavigator.tsx`
- [ ] `EmployerNavigator.tsx`
- [ ] Common components: Button, Input, Badge, Card, Avatar
- [ ] Common components: EmptyState, LoadingSpinner, ErrorBanner, StageBar, PrivacyLockedInfo

### Auth Screens
- [ ] SplashScreen
- [ ] OnboardingScreen
- [ ] RoleSelectScreen
- [ ] RegisterScreen
- [ ] LoginScreen
- [ ] OTPVerifyScreen
- [ ] IDUploadScreen
- [ ] PendingVerifyScreen

### Worker Screens
- [ ] HomeScreen (job feed)
- [ ] SearchScreen
- [ ] JobDetailScreen
- [ ] ApplyScreen
- [ ] MyApplicationsScreen
- [ ] ApplicationDetailScreen (all 4 stages)
- [ ] HireReceiptScreen
- [ ] WorkerProfileScreen
- [ ] EditProfileScreen
- [ ] WorkHistoryScreen
- [ ] AddWorkHistoryScreen
- [ ] CharacterReferencesScreen
- [ ] ReviewsScreen
- [ ] RateEmployerScreen
- [ ] ReportScreen
- [ ] NotificationsScreen

### Employer Screens
- [ ] EmployerHomeScreen
- [ ] PostJobScreen
- [ ] MyJobsScreen
- [ ] ViewApplicantsScreen
- [ ] ApplicantDetailScreen (all 4 stages)
- [ ] ConfirmHireScreen
- [ ] EmployerProfileScreen
- [ ] EditEmployerProfileScreen
- [ ] RateWorkerScreen
- [ ] EmployerReportScreen
- [ ] EmployerNotificationsScreen
