# ===========================================
# Supabase Migration Guide / Ръководство за миграция
# ===========================================

## 🚀 Стъпки за настройка на Supabase

### 1. Създай Supabase проект

1. Отиди на https://supabase.com и влез в акаунта си
2. Кликни "New Project"
3. Избери организация и въведи име на проекта
4. Избери регион (препоръчително: EU за по-бърза връзка)
5. Задай парола за базата данни (запази я!)
6. Кликни "Create new project" и изчакай 2-3 минути

### 2. Създай таблиците в базата данни

1. В Supabase Dashboard отиди на **SQL Editor** (ляво меню)
2. Кликни **New Query**
3. Копирай ЦЕЛИЯ код от файла `supabase-schema.sql`
4. Кликни **Run** (или Ctrl+Enter)
5. Трябва да видиш "Success. No rows returned" - това е ОК!

### 3. Вземи API ключовете

1. Отиди на **Project Settings** (иконка зъбно колело долу вляво)
2. Кликни на **API** в менюто
3. Копирай следните стойности:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (под "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`
   
   ⚠️ **ВАЖНО**: Използвай `service_role` key, НЕ `anon` key!
   Service role key има пълен достъп до базата данни.

### 4. Настрой .env файла

Създай `.env` файл в главната папка на проекта:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=твоят-супер-таен-ключ
RESEND_API_KEY=re_твоя_api_key
PORT=5000
```

### 5. Инсталирай зависимостите

```bash
npm install
```

### 6. Стартирай сървъра

```bash
npm start
```

Трябва да видиш:
```
✅ Connected to Supabase database
🔔 Reminder service starting...
✅ Reminder service started successfully
🚀 Server running on port 5000
```

---

## 📊 Структура на таблиците

> Всички таблици са в schema `public`. Row Level Security (RLS) е активиран за всички потребителски таблици.

---

### `users`
Профили на потребителите, свързани с `auth.users` чрез `auth_user_id`.

| Колона | Тип | Описание |
|--------|-----|----------|
| id | SERIAL | Първичен ключ |
| name | VARCHAR | Пълно име |
| email | VARCHAR | Email (уникален, NOT NULL) |
| auth_user_id | UUID | FK към `auth.users.id` (Supabase Auth) |
| reminder_days | INTEGER | Дни преди напомняне (по подразбиране 30) |
| reminder_enabled | BOOLEAN | Включени ли са напомняния |
| reminder_settings | JSONB | Детайлни настройки за напомняния |
| email_verified | BOOLEAN | Потвърден ли е email-ът |
| google_id | VARCHAR | Google OAuth ID (ако е логнат с Google) |
| password | VARCHAR | Хеширана парола (legacy, за server-side auth) |
| is_admin | BOOLEAN | Дали потребителят е администратор |
| created_at | TIMESTAMPTZ | Дата на създаване |
| updated_at | TIMESTAMPTZ | Дата на обновяване |

**RLS политики:**
- `INSERT` — разрешено за всички (`WITH CHECK (true)`)
- `SELECT` — само собственият профил (`auth.uid() = auth_user_id`)
- `UPDATE` — само собственият профил

**Индекси:** `email`, `auth_user_id`

---

### `cars`
Автомобили, принадлежащи на потребител.

| Колона | Тип | Описание |
|--------|-----|----------|
| id | SERIAL | Първичен ключ |
| user_id | INTEGER | FK към `users.id` (CASCADE DELETE) |
| brand | VARCHAR | Марка (NOT NULL) |
| model | VARCHAR | Модел (NOT NULL) |
| year | INTEGER | Година на производство |
| license_plate | VARCHAR | Регистрационен номер |
| vin | VARCHAR | VIN номер |
| color | VARCHAR | Цвят |
| engine_type | VARCHAR | Тип двигател |
| euro_standard | VARCHAR | Евро стандарт |
| fuel_type | VARCHAR | Тип гориво |
| tire_width | INTEGER | Ширина на гумата |
| tire_height | INTEGER | Профил на гумата |
| tire_diameter | INTEGER | Диаметър на гумата |
| tire_season | VARCHAR | Сезон на гумата |
| tire_brand | VARCHAR | Марка на гумата |
| tire_dot | VARCHAR | DOT код на гумата |
| notes | TEXT | Бележки |
| created_at | TIMESTAMPTZ | Дата на създаване |
| updated_at | TIMESTAMPTZ | Дата на обновяване |

**RLS политики:** Потребителят вижда/редактира само колите си (чрез `user_id` JOIN).

**Индекси:** `user_id`

---

### `services`
Сервизни записи и документи, свързани с автомобил.

| Колона | Тип | Описание |
|--------|-----|----------|
| id | SERIAL | Първичен ключ |
| car_id | INTEGER | FK към `cars.id` (CASCADE DELETE) |
| user_id | INTEGER | FK към `users.id` (CASCADE DELETE) |
| service_type | VARCHAR | Тип услуга (напр. `oil_change`, `vignette`, `civil_liability`) |
| expiry_date | DATE | Дата на изтичане |
| cost | NUMERIC(10,2) | Цена в лева |
| liters | NUMERIC(10,2) | Литри (само за зареждане с гориво) |
| price_per_liter | NUMERIC(10,4) | Цена на литър (само за гориво) |
| fuel_type | VARCHAR | Тип гориво (само за зареждане) |
| notes | TEXT | Бележки |
| mileage | INTEGER | Километраж при услугата |
| file_url | TEXT | URL на прикачен документ (Supabase Storage) |
| reminder_sent | BOOLEAN | Изпратено ли е имейл напомняне |
| created_at | TIMESTAMPTZ | Дата на запис |
| updated_at | TIMESTAMPTZ | Дата на обновяване |

**Поддържани типове услуги:** `oil_change`, `civil_liability`, `vignette`, `technical_inspection`, `fuel`, `tires`, `brakes`, `battery`, `air_filter`, `timing_belt`, `coolant`, `spark_plugs`, `transmission`, `other`

**RLS политики:** Потребителят вижда/редактира само сервизите за собствените си коли.

**Индекси:** `car_id`, `user_id`, `expiry_date`

---

### `accounts`
Допълнителни данни за акаунта на потребителя (телефон и др.).

| Колона | Тип | Описание |
|--------|-----|----------|
| id | SERIAL | Първичен ключ |
| user_id | INTEGER | FK към `users.id` (CASCADE DELETE) |
| name | VARCHAR | Имe |
| email | VARCHAR | Email |
| phone | VARCHAR | Телефонен номер |
| created_at | TIMESTAMPTZ | Дата на създаване |
| updated_at | TIMESTAMPTZ | Дата на обновяване |

**Индекси:** `user_id`

---

### `service_logs`
Лог на изпратените имейл напомняния.

| Колона | Тип | Описание |
|--------|-----|----------|
| id | SERIAL | Първичен ключ |
| user_id | INTEGER | FK към `users.id` |
| car_id | INTEGER | FK към `cars.id` |
| email | VARCHAR | Email на получателя |
| service_type | VARCHAR | Тип на услугата |
| expiry_date | DATE | Дата на изтичане |
| sent_at | TIMESTAMPTZ | Кога е изпратено напомнянето |
| created_at | TIMESTAMPTZ | Дата на запис |

**Индекси:** `user_id`, `email`, `service_type`, `created_at`

---

### `admins` (legacy)
Запазена за съвместимост. Администраторите се управляват чрез `users.is_admin = true`.

| Колона | Тип | Описание |
|--------|-----|----------|
| id | SERIAL | Първичен ключ |
| username | VARCHAR | Потребителско име (уникален) |
| email | VARCHAR | Email |
| password | VARCHAR | Хеширана парола |
| created_at | TIMESTAMPTZ | Дата на създаване |
| updated_at | TIMESTAMPTZ | Дата на обновяване |

> ⚠️ **Забележка:** Тази таблица не се използва активно. Adminите се идентифицират чрез `users.is_admin = true` и Supabase Auth.

---

## 🔒 Сигурност

- **Service Role Key**: Използва се САМО на сървъра, НИКОГА в клиентски код!
- Row Level Security (RLS) е активиран, но политиките не се прилагат при service_role
- Паролите се хешират с bcrypt преди запис

---

## 🆘 Отстраняване на проблеми

### "Missing Supabase environment variables!"
- Провери дали `.env` файлът съществува
- Провери дали `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` са зададени

### "Database connection error"
- Провери дали URL-ът е правилен
- Провери дали таблиците са създадени (изпълни SQL schema)
- Провери дали service_role key е правилен

### "relation 'users' does not exist"
- Изпълни SQL schema в Supabase SQL Editor

---

## 📱 Деплой на Supabase Edge Functions (Опционално)

Ако искаш да преместиш и backend логиката в Supabase:

1. Инсталирай Supabase CLI
2. Създай Edge Functions за всеки route
3. Деплойни с `supabase functions deploy`

Това е по-напреднала тема - текущата имплементация работи перфектно с Node.js сървър + Supabase база данни.
