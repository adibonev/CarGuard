-- =====================================================
-- Supabase SQL Schema за Car Checker
-- Изпълни този код в Supabase SQL Editor
-- =====================================================

-- Включване на UUID разширение (ако не е активно)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ТАБЛИЦА USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  reminder_days INTEGER NOT NULL DEFAULT 30,
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс за бързо търсене по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- 2. ТАБЛИЦА ADMINS
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ТАБЛИЦА CARS
-- =====================================================
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  license_plate VARCHAR(50),
  vin VARCHAR(50),
  engine_type VARCHAR(100),
  horsepower INTEGER,
  transmission VARCHAR(50),
  euro_standard VARCHAR(20),
  mileage INTEGER,
  fuel_type VARCHAR(50),
  tire_width INTEGER,
  tire_height INTEGER,
  tire_diameter INTEGER,
  tire_season VARCHAR(50),
  tire_brand VARCHAR(100),
  tire_dot VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс за бързо търсене на коли по user_id
CREATE INDEX IF NOT EXISTS idx_cars_user_id ON cars(user_id);

-- =====================================================
-- 4. ТАБЛИЦА SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type VARCHAR(100) NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  cost DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  liters DECIMAL(10, 2),
  price_per_liter DECIMAL(10, 2),
  fuel_type VARCHAR(50),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекси за бързо търсене
CREATE INDEX IF NOT EXISTS idx_services_car_id ON services(car_id);
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_expiry_date ON services(expiry_date);

-- =====================================================
-- 5. ТАБЛИЦА ACCOUNTS (Акаунти на новорегистрираните потребители)
-- =====================================================
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс за бързо търсене на акаунти по user_id
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- =====================================================
-- 6. ТАБЛИЦА SERVICE_LOGS (Лог на въведени услуги по потребител)
-- Следи кой потребител какви услуги е въвел
-- =====================================================
CREATE TABLE IF NOT EXISTS service_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  car_id INTEGER REFERENCES cars(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекси за бързо търсене
CREATE INDEX IF NOT EXISTS idx_service_logs_user_id ON service_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_email ON service_logs(email);
CREATE INDEX IF NOT EXISTS idx_service_logs_service_type ON service_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_service_logs_created_at ON service_logs(created_at);

-- =====================================================
-- 7. ФУНКЦИЯ ЗА АВТОМАТИЧНО ОБНОВЯВАНЕ НА updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери за автоматично обновяване на updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cars_updated_at ON cars;
CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_logs_updated_at ON service_logs;
CREATE TRIGGER update_service_logs_updated_at BEFORE UPDATE ON service_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Защита на ниво ред - всеки потребител вижда само своите данни
-- =====================================================

-- Активиране на RLS за таблиците
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- Политики за users (само четене на собствения профил)
-- ЗАБЕЛЕЖКА: Тъй като използваме собствена JWT автентикация през backend,
-- RLS политиките няма да се прилагат при използване на service_role key.
-- За по-голяма сигурност, може да използваш Supabase Auth.

-- =====================================================
-- 9. ВМЪКВАНЕ НА ADMIN ПО ПОДРАЗБИРАНЕ
-- Паролата е 'admin123' (bcrypt hash)
-- =====================================================
INSERT INTO admins (username, password, name)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrator')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- ГОТОВО! Схемата е създадена.
-- =====================================================
