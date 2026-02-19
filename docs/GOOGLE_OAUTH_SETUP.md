# 🔐 Google OAuth & Email Verification Setup Guide

## Какво е добавено?

Нов функционал за Google OAuth регистрация/логване и email верификация.

### Нови компоненти:

1. **Google Sign-In бутони** - на Login и Register страниците
2. **Email верификация** - потребителите могат да верифицират своя имейл
3. **Supabase Authentication** - интеграция със Supabase Auth
4. **OAuth callback handler** - обработка на Google redirect

---

## 🚀 Стъпки за активиране

### Стъп 1: Суbase Google OAuth Setup

1. Отидете на [Supabase Dashboard](https://app.supabase.com)
2. Изберете вашия проект
3. Отидете на **Authentication** → **Providers**
4. Намерете **Google** и кликнете **Enable**
5. Попълнете Google Client ID и Client Secret:
   - Google Client ID: `[ще получите от Google Console]`
   - Google Client Secret: `[ще получите от Google Console]`

### Стъп 2: Google Cloud Setup

1. Отидете на [Google Cloud Console](https://console.cloud.google.com)
2. Създайте нов проект или изберете съществуващ
3. Отидете на **APIs & Services** → **Credentials**
4. Кликнете **Create Credentials** → **OAuth client ID**
5. Изберете **Web application**
6. В **Authorized JavaScript origins** добавете:
   - `http://localhost:3000` (за development)
   - `https://your-domain.com` (за production)
7. В **Authorized redirect URIs** добавете:
   - `https://[your-project-id].supabase.co/auth/v1/callback` (най-важното)
   - `http://localhost:3000/auth/callback` (за development)
8. Копирайте **Client ID** и **Client Secret**

### Стъп 3: Supabase Configuration

1. Отидете в Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Вставете Google Client ID и Client Secret
3. Кликнете **Save**
4. Вашите redirect URI-ята трябва автоматично да се попълнят

### Стъп 4: Frontend Environment Variables

Обновете `.env.local` файла в `client/` папката:

```env
REACT_APP_SUPABASE_URL=https://[your-project-id].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[ваш-anon-key]
```

**Откъде да намеря тези?**
- Суpabase Dashboard → **Settings** → **API**
- Копирайте `URL` и `anon public` key

### Стъп 5: Backend Environment Variables

Обновете `.env` файла в корена:

```env
FRONTEND_URL=http://localhost:3000  # или вашата production URL
```

### Стъп 6: Restart приложението

```bash
# Спрете текущите Node процеси
Get-Process node | Stop-Process -Force

# Пустете отново
npm start  # в client/ папката
node server.js  # в root папката
```

---

## ✅ Тестване

1. Отидете на http://localhost:3000/register
2. Кликнете **"🔐 Регистрирай се с Google"**
3. Изберете Google акаунт
4. Трябва да бъдете редиректирани към Dashboard

---

## 📧 Email Verification

### За нови потребители със Google OAuth:

- Email верификацията е **автоматична** ако Google потвърди email адреса
- Status се вижда като `emailVerified` в потребителския профил

### За обичайна регистрация:

- Потребителите могат ръчно да верифицират своя имейл
- Изпраща се верификационен линк на тяхния email
- Кликването на линка ще верифицира email адреса

---

## 🔍 Troubleshooting

### "Failed to fetch" при клик на Google button?
- Проверете че `REACT_APP_SUPABASE_URL` и `REACT_APP_SUPABASE_ANON_KEY` са попълнени в `.env.local`
- Рестартирайте React dev server

### Google redirect не работи?
- Проверете че Redirect URI от Google Console отговаря на Supabase настройката
- Суbase Redirect URI е обикновено: `https://[projectid].supabase.co/auth/v1/callback`

### Email верификация не работи?
- Проверете че `email_verified` колона съществува в `users` таблица
- Проверете че `/api/auth/verify-email` endpoint е активен

### "Identifier not found" грешка?
- Това означава че Google ID не е намерен в базата
- Опитайте да се регистрирате отново
- Проверете че `google_id` колона съществува в `users` таблица

---

## 📝 New Database Columns

Следните колони са добавени автоматично чрез миграции:

```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
```

---

## 🎯 Next Steps

1. ✅ Активирайте Google OAuth във всички стъпки по-горе
2. ✅ Тестирайте регистрация със Google
3. ✅ Тестирайте email верификация
4. ✅ Проверете че потребителските данни се пазят в базата правилно

Успешна работа! 🚀
