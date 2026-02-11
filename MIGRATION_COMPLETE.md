# Миграция от Railway към Supabase - Завършена ✅

## Какво беше направено:

### 1. Authentication Migration
- ✅ Премахнато JWT localStorage authentication
- ✅ Използва се Supabase Auth (`supabase.auth.signInWithPassword`, `signUp`, `getSession`)
- ✅ Добавена `auth_user_id` колона в `users` таблица, свързана с `auth.users(id)`
- ✅ AuthContext преработен за Supabase session management
- ✅ Google OAuth работи чрез Supabase Auth

### 2. Database Operations Migration
- ✅ Създадени Supabase utility файлове:
  - `client/src/lib/supabaseCars.js` - Car CRUD операции + VIN декодиране
  - `client/src/lib/supabaseServices.js` - Service CRUD операции
  - `client/src/lib/supabaseAdmin.js` - Admin статистики и операции
- ✅ Dashboard обновен да използва Supabase queries
- ✅ CarForm обновен за VIN декодиране през Supabase
- ✅ Премахнати всички API axios calls

### 3. Row Level Security (RLS)
- ✅ RLS enabled на всички таблици: `users`, `cars`, `services`, `accounts`
- ✅ Създадени policies за SELECT, INSERT, UPDATE, DELETE базирани на `auth.uid()`
- ✅ Потребителите виждат само своите данни

### 4. Email Reminders - Edge Function
- ✅ Deploy-ната Supabase Edge Function: `check-reminders`
- ✅ Използва Resend API за email изпращане
- ✅ Заменя Node.js reminder service от Railway

### 5. Admin Panel Migration
- ✅ Добавена `is_admin` колона в `users` таблица
- ✅ AdminLogin обновен да използва Supabase Auth
- ✅ AdminDashboard обновен да използва `supabaseAdmin` service
- ✅ Премахната зависимост от Railway backend

## Настройка за Deploy:

### 1. Environment Variables (Netlify)
Обнови `.env` файла и Netlify environment variables:

```bash
# Supabase
REACT_APP_SUPABASE_URL=https://lyttoaknjphiirxxyzohhd.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<твоя anon key>

# Премахни старите Railway променливи
# REACT_APP_API_URL - вече не е нужно!
```

### 2. Supabase Edge Function Environment
Добави RESEND_API_KEY в Supabase Edge Function secrets:

```bash
# В Supabase Dashboard -> Edge Functions -> Secrets
RESEND_API_KEY=re_LoVGqBeA_B1UAPb8w8ztJXgWThih1Y8Px
```

### 3. Настрой Cron Job за Reminders
В Supabase Dashboard -> Edge Functions -> check-reminders:
- Enable Cron Trigger
- Schedule: `0 */6 * * *` (на всеки 6 часа)

### 4. Създай Admin потребител
Изпълни SQL в Supabase:

```sql
-- Замени с твоя email
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-admin-email@example.com';
```

### 5. Deploy на Netlify

```bash
cd client
npm run build
# Deploy се случва автоматично чрез Git push
```

## Какво да изтриеш:

### Railway Backend (МОЖЕ ДА СЕ ИЗТРИЕ)
- ❌ `server.js`
- ❌ `routes/` folder
- ❌ `middleware/` folder
- ❌ `models/` folder (User, Car, Service моделите)
- ❌ `services/reminderService.js`
- ❌ `services/emailService.js`
- ❌ Railway deployment

### Config файлове (МОЖЕ ДА СЕ ИЗТРИЕ)
- ❌ `config/supabase.js` (old config)

### Запази само:
- ✅ `client/` folder (React app)
- ✅ `.env` с Supabase credentials
- ✅ `README.md`, `package.json`, etc.

## Тестване:

1. **Registration/Login** - Тествай email/password регистрация и логин
2. **Google OAuth** - Тествай Google sign-in
3. **Cars CRUD** - Добави, редактирай, изтрий коли
4. **Services CRUD** - Добави, редактирай, изтрий услуги
5. **VIN Decode** - Тествай VIN декодиране
6. **Admin Panel** - Влез като admin и виж статистиките
7. **Reminders** - Провери Edge Function в Supabase logs

## Архитектура след миграция:

```
┌─────────────┐
│   Client    │ (Netlify)
│  React App  │
└──────┬──────┘
       │
       ├─── Direct Supabase Queries (RLS)
       │
┌──────▼──────────────────────────────────┐
│           Supabase                      │
│  ┌────────────┐  ┌──────────────────┐  │
│  │  Auth      │  │  PostgreSQL DB    │  │
│  │  (Google)  │  │  (RLS Policies)   │  │
│  └────────────┘  └──────────────────┘  │
│  ┌────────────────────────────────────┐ │
│  │  Edge Functions                    │ │
│  │  - check-reminders (Cron)          │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────────────┐
        │  Resend API  │ (Email)
        └──────────────┘
```

## Разходи:

- **Netlify**: Free tier (достатъчен)
- **Supabase**: Free tier (500MB DB, 2GB bandwidth)
- **Resend**: Free tier (100 emails/day)
- **Railway**: ❌ МОЖЕ ДА СЕ ИЗТРИЕ - $0/месец икономия!

## Следващи стъпки:

1. ✅ Deploy на Netlify
2. ✅ Тествай всички функционалности
3. ✅ Настрой cron job за reminders
4. ✅ Създай admin акаунт
5. ✅ Изтрий Railway deployment
