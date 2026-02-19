# CarGuard 🚗

**CarGuard** is a full-stack web application for tracking vehicle service history, managing car documents, and receiving automated email reminders before key services expire (insurance, vignette, inspection, etc.).

Live demo: [car-guard.netlify.app](https://car-guard.netlify.app)

---

## Table of Contents

1. [Project Description](#project-description)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Local Development Setup](#local-development-setup)
5. [Key Folders and Files](#key-folders-and-files)
6. [Environment Variables](#environment-variables)

---

## Project Description

CarGuard lets registered users:

- **Add and manage multiple vehicles** (brand, model, year, color, mileage, license plate)
- **Log service records** for each car — Civil Liability Insurance, Casco, Vignette, Yearly Inspection, Vehicle Tax, Fire Extinguisher, and general Maintenance
- **Track expiry dates** with a color-coded status indicator (valid / expiring soon / expired)
- **Upload documents** (PDFs, images) linked to each service record, stored in Supabase Storage
- **Upload a profile photo** stored in Supabase Storage
- **Set per-service email reminder windows** (7 / 14 / 30 / 60 / 90 days before expiry)
- **Receive automated email reminders** via a scheduled Supabase Edge Function + cron job
- **Export service records as PDF**
- **Sign in with Google** via Supabase OAuth

An **admin panel** (`/admin`) lets authorized administrators:

- View all registered users and their vehicle counts
- See platform-wide statistics (total cars, services, most popular service types)

---

## Architecture

### Frontend

| Technology | Role |
|---|---|
| **React 18** (JSX, hooks only) | UI library |
| **React Router v6** | Client-side routing with nested routes |
| **Bootstrap 5** | Layout, grid, utility classes |
| **Vite** | Dev server and production bundler |
| **jsPDF + html2canvas** | In-browser PDF generation |

The frontend is a **Single-Page Application** deployed on **Netlify**. All data access goes directly through the Supabase JS client — there is no custom backend API in production.

### Backend — Supabase (BaaS)

| Supabase Service | Usage |
|---|---|
| **PostgreSQL Database** | All application data (users, cars, services) |
| **Supabase Auth** | User registration, login, JWT sessions, Google OAuth |
| **Supabase Storage** | User file uploads (documents bucket + avatars bucket) |
| **Edge Functions** (Deno) | Server-side scheduled tasks (email reminders) |
| **pg_cron** | Cron scheduler that triggers the reminder Edge Function hourly |
| **Row Level Security (RLS)** | Database-level access control per user |

A lightweight **Express.js** server (`server.js`) exists for local development utilities only; it is not used in production.

### Deployment

```
Browser → Netlify CDN (React SPA)
              ↓ supabase-js client
         Supabase Platform
         ├── Auth (JWT / Google OAuth)
         ├── PostgreSQL + RLS
         ├── Storage (S3-compatible)
         └── Edge Functions (Deno runtime)
```

### Auth flow

1. User registers/logs in → Supabase Auth issues a JWT
2. `AuthContext` listens to `onAuthStateChange` and loads user profile from `public.users`
3. JWT is attached automatically to all subsequent Supabase API calls
4. RLS policies on each table enforce per-user data isolation
5. Admin access is gated on `is_admin = true` in `public.users`

---

## Database Schema

Six tables in the `public` schema. All foreign keys into `auth.users` use `auth_user_id` (UUID).

```
┌──────────────────────────────────────────────────────────────┐
│  auth.users  (Supabase managed)                              │
│  ─────────────────────────────                               │
│  id (uuid) PK                                                │
└────────────────────┬─────────────────────────────────────────┘
                     │ 1
                     │
                     ▼ N
┌─────────────────────────────────────────────────────────────┐
│  public.users                                               │
│  ─────────────────────────────────────────────────────────  │
│  id            uuid  PK  default gen_random_uuid()          │
│  auth_user_id  uuid  FK → auth.users(id)  UNIQUE            │
│  name          text                                         │
│  email         text  UNIQUE                                 │
│  password      text  (hashed, legacy)                       │
│  is_admin      boolean  default false                        │
│  email_verified boolean default false                       │
│  google_id     text                                         │
│  avatar_url    text                                         │
│  reminder_enabled  boolean  default true                    │
│  reminder_days     integer  default 30                      │
│  reminder_settings jsonb   (per-service thresholds)         │
│  created_at    timestamptz  default now()                   │
│  updated_at    timestamptz                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ 1
                           │
                           ▼ N
┌─────────────────────────────────────────────────────────────┐
│  public.cars                                                │
│  ─────────────────────────────────────────────────────────  │
│  id         uuid  PK  default gen_random_uuid()             │
│  user_id    uuid  FK → public.users(id)  ON DELETE CASCADE  │
│  brand      text                                            │
│  model      text                                            │
│  year       integer                                         │
│  color      text                                            │
│  mileage    integer                                         │
│  plate      text                                            │
│  created_at timestamptz  default now()                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ 1
                           │
                           ▼ N
┌─────────────────────────────────────────────────────────────┐
│  public.services                                            │
│  ─────────────────────────────────────────────────────────  │
│  id           uuid  PK  default gen_random_uuid()           │
│  car_id       uuid  FK → public.cars(id)  ON DELETE CASCADE │
│  service_type text  (civil_liability | casco | vignette |   │
│                      inspection | tax | fire_extinguisher | │
│                      maintenance)                           │
│  start_date   date                                          │
│  expiry_date  date                                          │
│  cost         numeric                                       │
│  notes        text                                          │
│  file_url     text  (Supabase Storage URL)                  │
│  created_at   timestamptz  default now()                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  public.accounts                                            │
│  ─────────────────────────────────────────────────────────  │
│  id           uuid  PK                                      │
│  user_id      uuid  FK → public.users(id)                   │
│  provider     text  (email | google)                        │
│  created_at   timestamptz                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  public.admins                                              │
│  ─────────────────────────────────────────────────────────  │
│  id           uuid  PK                                      │
│  email        text  UNIQUE                                  │
│  password     text  (hashed)                                │
│  created_at   timestamptz                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  public.service_logs                                        │
│  ─────────────────────────────────────────────────────────  │
│  id           uuid  PK                                      │
│  service_id   uuid  FK → public.services(id)                │
│  action       text                                          │
│  performed_at timestamptz                                   │
└─────────────────────────────────────────────────────────────┘
```

### Storage Buckets

| Bucket | Visibility | Max Size | Allowed MIME |
|---|---|---|---|
| `documents` | Public | 50 MB | `image/*`, `application/pdf` |
| `avatars` | Public | 5 MB | `image/*` |

Path conventions:
- Documents: `service-documents/{userId}/{serviceId}_{timestamp}.{ext}`
- Avatars: `{userId}/{timestamp}.{ext}`

RLS on `storage.objects` ensures each user can only upload/update/delete files inside their own folder.

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/car-checker.git
cd car-checker
```

### 2. Install dependencies

```bash
# Root (Express dev server)
npm install

# Frontend (React + Vite)
cd client && npm install && cd ..
```

### 3. Configure environment variables

Create `client/.env.local`:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> Both values are found in your Supabase project → Settings → API.

### 4. Apply database migrations

All migrations live in `supabase/migrations/`. Apply them in order via the Supabase SQL Editor or Supabase CLI:

```bash
# With Supabase CLI (optional)
supabase db push
```

Or run each `.sql` file manually in the Supabase SQL Editor.

### 5. Start the development servers

**Option A — VS Code tasks (recommended)**

Open the Command Palette → `Tasks: Run Task` → `▶️ Start Both (Server + Client)`

**Option B — Manual terminals**

```bash
# Terminal 1 — Express dev server (optional, not needed for most features)
node server.js

# Terminal 2 — React/Vite dev server
cd client && npm start
```

The React app will be available at `http://localhost:5173`.

### 6. Google OAuth (optional)

Follow [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) to enable Google sign-in for local development.

---

## Key Folders and Files

```
car-checker/
│
├── client/                          # React SPA (deployed to Netlify)
│   ├── index.html                   # Vite entry HTML
│   ├── vite.config.js               # Vite configuration
│   ├── package.json                 # Frontend dependencies
│   └── src/
│       ├── index.jsx                # React root mount point
│       ├── App.jsx                  # Router setup + AuthProvider wrapper
│       │
│       ├── context/
│       │   ├── AuthContext.jsx      # Global auth state (user, login, logout, setUser)
│       │   └── DashboardContext.jsx # Dashboard state (cars, services, reminders, docs)
│       │
│       ├── components/
│       │   ├── DashboardLayout.jsx  # Shared dashboard shell (navbar + <Outlet />)
│       │   ├── CarForm.jsx          # Add/edit car modal form
│       │   ├── CarList.jsx          # Car cards grid
│       │   ├── ServiceForm.jsx      # Add/edit service modal form
│       │   ├── ServiceList.jsx      # Services table with status badges
│       │   └── PrivateRoute.jsx     # Auth guard wrapper component
│       │
│       ├── pages/
│       │   ├── Home.jsx             # Public landing page
│       │   ├── Login.jsx            # Email/password + Google login
│       │   ├── Register.jsx         # Registration form
│       │   ├── VerifyEmail.jsx      # Post-registration email verification prompt
│       │   ├── AuthCallback.jsx     # OAuth redirect handler
│       │   ├── Overview.jsx         # Dashboard home — summary cards + charts
│       │   ├── Vehicles.jsx         # Cars management page
│       │   ├── Services.jsx         # Services management page
│       │   ├── Documents.jsx        # File upload and document browser
│       │   ├── Settings.jsx         # Profile info, avatar upload, reminder config
│       │   ├── AdminLogin.jsx       # Admin-only login page (/admin)
│       │   └── AdminDashboard.jsx   # Admin statistics and user overview
│       │
│       ├── lib/
│       │   ├── supabaseAuth.js      # Supabase client, auth helpers, uploadAvatar()
│       │   ├── supabaseCars.js      # CRUD for cars table
│       │   ├── supabaseServices.js  # CRUD for services table + uploadFile()
│       │   ├── supabaseAdmin.js     # Admin statistics queries
│       │   └── pdfService.js        # PDF export using jsPDF
│       │
│       ├── data/
│       │   ├── carBrands.js         # Static list of car brands
│       │   └── brandLogos.js        # Brand → logo URL mappings
│       │
│       └── styles/                  # One CSS file per page / component
│           ├── theme.css
│           ├── Home.css
│           ├── Dashboard.css
│           ├── CarForm.css
│           └── ...
│
├── supabase/
│   └── migrations/                  # Ordered SQL migration files (12 total)
│       ├── 20260208000000_initial_schema.sql
│       ├── 20260209000000_add_email_verified.sql
│       └── ... (12 files total)
│
├── config/
│   └── supabase.js                  # Server-side Supabase client (dev only)
│
├── routes/                          # Express routes (local dev only)
│   ├── auth.js
│   ├── cars.js
│   ├── services.js
│   └── admin.js
│
├── services/
│   ├── emailService.js              # Nodemailer email sending (dev only)
│   └── reminderService.js           # Reminder scheduling logic (dev only)
│
├── server.js                        # Express dev server entry point
├── netlify.toml                     # Netlify deploy config (redirects SPA routes)
├── GOOGLE_OAUTH_SETUP.md            # Guide for setting up Google OAuth
├── SUPABASE_SETUP.md                # Guide for setting up Supabase project
└── STORAGE_SETUP.md                 # Guide for configuring Storage buckets
```

---

## Environment Variables

### `client/.env.local` (frontend)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

### Root `.env` (Express dev server — optional)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Service role key (bypasses RLS — keep secret) |
| `PORT` | Express server port (default: 5000) |

---

## License

MIT


- 📝 **Регистрация и вход** - Безопасна аутентификация на потребители
- 🚗 **Управление на автомобили** - Добавяне, редактиране и изтриване на автомобили
- 🛡️ **Управление на услуги**:
  - Гражданска отговорност
  - Винетка
  - Технически преглед
  - КАСКО
  - Данък
- 📧 **Автоматични напомени** - Email напомени 1 месец преди изтичане на услуга
- 📊 **Статус панел** - Визуално показване на статуса на всяка услуга

## Технологии

### Backend
- **Node.js** + Express.js
- **MongoDB** - База данни
- **JWT** - Аутентификация
- **Nodemailer** - Email услуга
- **bcryptjs** - Криптография на пароли

### Frontend
- **React 18** - UI библиотека
- **React Router** - Маршрутизация
- **Axios** - HTTP клиент
- **CSS3** - Стилизиране

## Инсталация

### Требования
- Node.js (v14 или по-нова)
- MongoDB (локална или cloud)

### Стъпки

1. **Клониране на проекта**
```bash
cd "Car Checker"
```

2. **Инсталиране на backend依存性**
```bash
npm install
```

3. **Конфигуриране на .env файл**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/car-checker
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
NODE_ENV=development
```

4. **Инсталиране на frontend依存性**
```bash
cd client
npm install
cd ..
```

5. **Стартиране на приложението**

**Терминал 1 - Backend:**
```bash
npm start
```

**Терминал 2 - Frontend:**
```bash
npm run client
```

Приложението ще бъде достъпно на `http://localhost:3000`

## Конфигуриране на Email

За включване на email напомините, следвай тези стъпки:

1. **Gmail:**
   - Включи 2-факторната аутентификация в твоя Gmail акаунт
   - Генерирай App Password за специално приложение
   - Постави Email_USER и EMAIL_PASSWORD в .env файла

2. **Други email провайдери:**
   - Модифицирай emailService.js със съответния SMTP сервер

## Как работи системата

1. Потребителят се регистрира и влиза в системата
2. Добавя своите автомобили (марка, модел, година)
3. За всеки автомобил добавя услуги и датите на изтичане
4. Системата проверява всеки час за услуги, които ще изтекат в следващите 30 дни
5. Отпраща email напомена 1 месец преди изтичане на услугата
6. Потребителят може да подновява услугите чрез платформата

## Структура на проекта

```
Car Checker/
├── server.js              # Главен серверен файл
├── package.json          # Backend依存性
├── .env                  # Конфигурация
├── models/               # MongoDB модели
│   ├── User.js
│   ├── Car.js
│   └── Service.js
├── routes/               # API маршрути
│   ├── auth.js
│   ├── cars.js
│   └── services.js
├── middleware/           # Express middleware
│   └── auth.js          # JWT проверка
├── services/             # Бизнес логика
│   ├── emailService.js   # Email функции
│   └── reminderService.js # Проверка и изпращане на напомени
└── client/               # React приложение
    ├── public/
    ├── src/
    │   ├── pages/        # Страници
    │   ├── components/   # React компоненти
    │   ├── context/      # React контекст
    │   ├── styles/       # CSS файлове
    │   ├── api.js        # API функции
    │   └── App.js
    └── package.json
```

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Автомобили
- `GET /api/cars` - Всички автомобили на потребителя
- `POST /api/cars` - Добавяне на нов автомобил
- `PUT /api/cars/:id` - Редактиране на автомобил
- `DELETE /api/cars/:id` - Изтриване на автомобил

### Услуги
- `GET /api/services/car/:carId` - Услуги за конкретна кола
- `POST /api/services` - Добавяне на услуга
- `PUT /api/services/:id` - Редактиране на услуга
- `DELETE /api/services/:id` - Изтриване на услуга

## Лицензия

MIT

## Контакт

За въпроси и предложения, свържи се с разработчика.
