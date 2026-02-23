# Admin Panel — Документация

## Общ преглед

Admin панелът позволява на администраторите да следят и управляват всички потребители, автомобили и сервизни записи в Car Checker. Достъпен е на `/admin` и `/admin/dashboard`.

---

## Достъп и автентикация

### Как работи

Admin панелът използва **Supabase Auth** — няма отделна auth система.

1. Администраторът отива на `/admin`
2. Влиза с email и парола (стандартен Supabase Auth login)
3. Системата проверява дали `users.is_admin = true` за този потребител
4. При успех се записва в `localStorage`:
   - `isAdmin = 'true'`
   - `adminUser` = JSON обект с профила
5. Пренасочване към `/admin/dashboard`

### Как се дава admin права на потребител

В Supabase SQL Editor изпълни:

```sql
UPDATE public.users
SET is_admin = true
WHERE email = 'admin@example.com';
```

> ⚠️ **Важно:** Колоната `is_admin` трябва да е дефинирана в таблицата. Ако не е:
> ```sql
> ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
> ```

### Сигурност

- При всяко зареждане на `/admin/dashboard` се проверява дали има активна Supabase сесия
- Ако сесията е изтекла или липсва — автоматично logout и пренасочване към `/admin`
- `localStorage` се изчиства при logout

---

## Файлова структура

| Файл | Описание |
|------|----------|
| `client/src/pages/AdminLogin.jsx` | Страница за вход в admin панела |
| `client/src/pages/AdminDashboard.jsx` | Главен admin интерфейс |
| `client/src/lib/supabaseAdmin.js` | Всички Supabase заявки за admin данни |
| `client/src/styles/AdminLogin.css` | Стилове за login страницата |
| `client/src/styles/AdminDashboard.css` | Стилове за dashboard-а |

---

## Функционалност

### 1. Обзорна статистика (`overview` таб)

Показва карти с ключови метрики в реално време:

| Метрика | Описание |
|---------|----------|
| Общо потребители | Брой записи в `users` |
| Общо автомобили | Брой записи в `cars` |
| Общо сервизни записи | Брой записи в `services` |
| Изтичащи (30 дни) | Сервизи с `expiry_date` в следващите 30 дни |
| Нови потребители днес | Регистрации от началото на деня |
| Нови потребители тази седмица | Регистрации от последните 7 дни |
| Нови потребители този месец | Регистрации от последните 30 дни |
| Сервизи този месец | Записи от последните 30 дни |

### 2. Списък с потребители (`users` таб)

Таблица с всички регистрирани потребители:

| Колона | Описание |
|--------|----------|
| Име | `users.name` |
| Email | `users.email` |
| Автомобили | Брой коли за потребителя |
| Сервизни записи | Брой сервизни записи |
| Регистриран | `users.created_at` |

### 3. Графики

- **Марки автомобили** — разпределение по марка (Top 10)
- **Сервизни типове** — най-честите типове сервизни записи
- **Регистрации** — нови потребители по дни (последните 30 дни)

---

## `supabaseAdmin.js` — API методи

### `adminService.isAdmin(userId)`
Проверява дали потребител има `is_admin = true`.

### `adminService.getStats()`
Връща обект с всички статистики (вж. секцията по-горе).

### `adminService.getUsers()`
Връща всички потребители с брой коли и сервизи:
```js
[{ id, name, email, createdAt, auth_user_id, carCount, serviceCount }]
```

### `adminService.getBrandChart()`
Връща топ марки автомобили:
```js
[{ brand: 'Toyota', count: 12 }, ...]
```

### `adminService.getServiceChart()`
Връща разпределение на типовете сервизни записи:
```js
[{ service_type: 'oil_change', count: 25 }, ...]
```

### `adminService.getRegistrationChart()`
Връща дневни регистрации за последните 30 дни:
```js
[{ date: '2026-02-01', count: 3 }, ...]
```

---

## RLS и admin достъп

Admin панелът използва **клиентски Supabase (`anon` key)** — следователно RLS политиките се прилагат.

За да могат admin заявките да четат **всички** потребители/коли/сервизи, трябва да има RLS политики за admin:

```sql
-- Позволи на admins да четат всички потребители
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_admin = true
  )
);

-- Позволи на admins да четат всички коли
CREATE POLICY "Admins can view all cars"
ON public.cars FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_admin = true
  )
);

-- Позволи на admins да четат всички сервизни записи
CREATE POLICY "Admins can view all services"
ON public.services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.is_admin = true
  )
);
```

> Тези политики вече са добавени чрез миграцията `20260219185955_add_admin_rls_policies.sql`.

---

## Маршрути

| Път | Компонент | Описание |
|-----|-----------|----------|
| `/admin` | `AdminLogin` | Форма за вход |
| `/admin/dashboard` | `AdminDashboard` | Главен панел (изисква `isAdmin` в localStorage + активна сесия) |

---

## Отстраняване на проблеми

### "You do not have admin privileges"
→ Потребителят не е маркиран като admin. Изпълни SQL-а за задаване на `is_admin = true`.

### Данните не се зареждат / грешки при заявки
→ Вероятно липсват RLS политики за admin. Провери дали миграцията `20260219185955_add_admin_rls_policies.sql` е изпълнена.

### Автоматичен logout при опресняване
→ Supabase сесията е изтекла. Влез отново от `/admin`.
