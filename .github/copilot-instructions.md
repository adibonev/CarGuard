# Copilot Instructions — Car Checker

## App Overview
Car Checker is a web application that allows users to track their vehicles and
manage car service history. Users can add multiple cars, log service events,
set reminders for upcoming maintenance, and export service records as PDF.
An admin panel allows oversight of all users and vehicles.

---

## Architecture

- **Frontend:** React 18 (JSX), Bootstrap 5, Vite — served as a static SPA
- **Backend:** Supabase (PostgreSQL database, Auth, Storage, REST API)
- **Build tools:** Node.js, npm, Vite
- **Communication:** All data access goes through the Supabase JS client (`@supabase/supabase-js`), which calls the Supabase REST API directly from the browser.
- **No custom backend API** — there is a `server/server.js` (Express) only for local dev/admin utilities; production relies fully on Supabase.

---

## Project Structure

```
client/
  src/
    pages/          # One file per page/route (Home, Login, Register, Dashboard, ...)
    components/     # Reusable UI components (CarForm, CarList, ServiceForm, ...)
    context/        # React context for global state (AuthContext, DashboardContext)
    lib/            # Supabase service modules (supabaseCars, supabaseServices, supabaseAuth, ...)
    styles/         # One CSS file per page/component
    data/           # Static data (car brands, logos)
    App.jsx         # Router + AuthProvider
    index.jsx       # Entry point

server/
  server.js         # Express entry point (local dev only)
  config/           # Supabase server-side config
  middleware/       # Express auth middleware
  models/           # Data models
  routes/           # Express routes
  services/         # Email + reminder services

supabase/
  migrations/       # Ordered SQL migration files

docs/               # Setup guides (OAuth, Supabase, Storage)
```

---

## Key Conventions

- **Pages** live in `src/pages/` — one `.jsx` file per route. Never put page logic inside `App.jsx`.
- **Business logic** lives in `src/lib/` — each Supabase entity has its own file (e.g. `supabaseCars.js` for CRUD on cars).
- **Styles** live in `src/styles/` — one CSS file per page or component, imported directly into that component.
- **Components** in `src/components/` must be self-contained and reusable.
- **Do not create monolithic files** — keep pages, logic, and styles in separate files.
- **Authentication** is handled exclusively via Supabase Auth. Use `AuthContext` for all auth state across the app.
- **Multi-page routing** is done with React Router v6. Each page maps to a unique path.
- **Private routes** use the `PrivateRoute` component which reads from `AuthContext`.

---

## Routes

| Path                        | Component         | Auth required |
|-----------------------------|-------------------|---------------|
| `/`                         | Home              | No            |
| `/login`                    | Login             | No            |
| `/register`                 | Register          | No            |
| `/verify-email`             | VerifyEmail       | No            |
| `/auth/callback`            | AuthCallback      | No            |
| `/dashboard`                | Overview          | ✅ Yes         |
| `/dashboard/vehicles`       | Vehicles          | ✅ Yes         |
| `/dashboard/services`       | Services          | ✅ Yes         |
| `/dashboard/documents`      | Documents         | ✅ Yes         |
| `/dashboard/settings`       | Settings          | ✅ Yes         |
| `/admin`                    | AdminLogin        | No            |
| `/admin/dashboard`          | AdminDashboard    | Admin only    |

All `/dashboard/*` routes share the `DashboardLayout` component (navbar + mobile nav + modals) and the `DashboardContext` for shared state.

---

## Supabase Tables

- `users` — app user profiles (linked to `auth.users` via `auth_user_id`)
- `accounts` — account metadata per user
- `cars` — vehicles belonging to a user
- `services` — service records linked to a car

---

## Coding Guidelines

- Use functional React components with hooks only (`useState`, `useEffect`, `useContext`).
- Do not use class components.
- Do not use TypeScript.
- Always handle Supabase errors explicitly and show user-friendly messages.
- When inserting into `users`, always check for existing records by both `auth_user_id` and `email` to avoid unique constraint violations.
- Use Bootstrap 5 utility classes for layout and spacing; write custom CSS only when Bootstrap is insufficient.
- Keep components small and focused — split if a component exceeds ~150 lines.
