# ProjectHub — React + Zustand Project Management App

A production-ready React template for a multi-module project management application with Zustand state management, TanStack Query for data fetching, and a clean modular folder structure.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and set your API URL
cp .env.example .env

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Folder Structure

```
src/
├── assets/               # Images, icons, fonts
├── components/
│   ├── common/           # Shared UI: LoadingSpinner, EmptyState, etc.
│   ├── layout/           # AppLayout, Sidebar, Header
│   └── ui/               # Reusable primitives: Modal, Dropdown, etc.
├── constants/            # App-wide constants and config
├── hooks/                # Global shared hooks
├── lib/
│   └── apiClient.ts      # Axios instance with interceptors + auto-refresh
├── modules/              # Feature modules (one per page)
│   ├── auth/
│   │   ├── components/   # LoginPage
│   │   ├── hooks/        # useAuth
│   │   └── store/        # authStore (Zustand)
│   ├── dashboard/
│   ├── users/
│   ├── ingestion/
│   ├── chat/
│   ├── anomaly/
│   └── innovations/
├── routes/               # React Router config + route guards
├── services/
│   └── api/              # API service layer per module
├── store/                # Global Zustand stores (uiStore, etc.)
├── styles/               # globals.css with Tailwind layers
├── types/                # Shared TypeScript types/interfaces
└── utils/                # Helper functions (cn, formatDate, etc.)
```

---

## 🗃️ State Management (Zustand)

Each module owns its Zustand store:

| Store | Location | Purpose |
|-------|----------|---------|
| `useAuthStore` | `modules/auth/store/authStore.ts` | User session, tokens |
| `useUIStore` | `store/uiStore.ts` | Sidebar, theme, global loading |
| `useIngestionStore` | `modules/ingestion/store/ingestionStore.ts` | File upload queue |
| `useChatStore` | `modules/chat/store/chatStore.ts` | Sessions & messages |

All stores use **immer** middleware for clean mutations and **persist** (auth) for local storage sync.

---

## 🔌 Connecting Your APIs

Each module has a service file in `src/services/api/`:

```ts
// src/services/api/modules.api.ts
import { ingestionApi, chatApi, anomalyApi, innovationsApi, dashboardApi } from '@/services/api/modules.api'
import { usersApi } from '@/services/api/users.api'
import { authApi } from '@/services/api/auth.api'
```

Use them with TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/services/api/users.api'

const { data, isLoading } = useQuery({
  queryKey: ['users', page],
  queryFn: () => usersApi.getAll({ page, pageSize: 10 }).then(r => r.data.data),
})
```

Set your API base URL in `.env`:
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🧩 Modules Overview

| Module | Route | Description |
|--------|-------|-------------|
| Login | `/login` | Auth with JWT, auto-refresh on 401 |
| Dashboard | `/dashboard` | KPI cards, charts, quick actions |
| User Management | `/users` | CRUD users, roles, search/filter |
| Ingestion | `/ingestion` | Drag-&-drop file upload with progress |
| Chat | `/chat` | Session-based AI chat interface |
| Anomaly Detection | `/anomaly` | Severity triage, status management |
| Innovations | `/innovations` | Idea submissions, voting, status tracking |

---

## 🛠️ Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI |
| Vite | 5 | Build tool |
| TypeScript | 5 | Type safety |
| Zustand | 4 | State management |
| TanStack Query | 5 | Server state / caching |
| React Router | 6 | Routing + guards |
| Axios | 1 | HTTP client |
| React Hook Form + Zod | — | Forms + validation |
| Tailwind CSS | 3 | Styling |
| react-dropzone | 14 | File uploads |
| react-hot-toast | 2 | Notifications |
| Recharts | 2 | Charts |
| immer | 10 | Immutable state updates |
| lucide-react | — | Icons |

---

## 📝 Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
npm run format    # Prettier
```

---

## 🔐 Auth Flow

1. `LoginPage` calls `useAuth().login(credentials)`
2. `authApi.login()` hits your backend
3. Tokens stored in `authStore` + `localStorage`
4. `apiClient.ts` attaches `Authorization: Bearer <token>` to all requests
5. On 401, auto-refresh is attempted; on failure, user is redirected to `/login`
6. `ProtectedRoute` in `routes/index.tsx` guards all authenticated pages

---

## 🎨 Styling

Global CSS utility classes are defined in `src/styles/globals.css`:
- `.card`, `.card-header` — consistent card layouts
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, etc.
- `.input`, `.label`, `.error-text` — form elements
- `.table`, `.table-container` — data tables
- `.badge`, `.badge-success`, `.badge-warning`, etc.
- `.sidebar-link` — navigation items
- `.page-container`, `.page-title`, `.page-subtitle` — page scaffolding
