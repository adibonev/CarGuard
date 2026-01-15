import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <h1 className="logo">🚗 CarGuard</h1>
          <nav className="nav-links">
            <button className="nav-btn login-btn" onClick={() => navigate('/login')}>
              Вход
            </button>
            <button className="nav-btn register-btn" onClick={() => navigate('/register')}>
              Регистрация
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2>Никогда не забравяй сроковете на своята кола</h2>
          <p>
            CarGuard ти помага да управляваш всички услуги на твоя автомобил на едно място.
            Автоматични напомени преди да изтекат важните дати.
          </p>
          <button className="cta-btn" onClick={() => navigate('/register')}>
            Започни безплатно
          </button>
        </div>
        <div className="hero-image">
          <div className="car-icon">🏎️</div>
        </div>
      </section>

      {/* Why Section */}
      <section className="why-section">
        <h2>Защо CarGuard?</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">⏰</div>
            <h3>Не забравяй сроковете</h3>
            <p>
              Получавай email напомена точно 1 месец преди изтичане на всяка услуга.
              Има време да подновиш всичко спокойно.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">📋</div>
            <h3>Всичко на едно място</h3>
            <p>
              Управляй гражданска отговорност, винетка, преглед, каско и данък
              от един удобен интерфейс.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">🚨</div>
            <h3>Никога не нарушавай закона</h3>
            <p>
              Избегни глобите и проблемите с законодателството. Всички твои документи
              са винаги под контрол.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">💰</div>
            <h3>Спести пари</h3>
            <p>
              Подновявай услугите навреме и избегни скъпи санкции. Управлявай бюджета
              на твоя автомобил разумно.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">🔐</div>
            <h3>Защита на данните</h3>
            <p>
              Твоите лични данни са защитени с криптирани пароли. Никой нямал достъп
              до твоята информация.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">📱</div>
            <h3>Достъп отвсякъде</h3>
            <p>
              Отвори CarGuard от телефон, таблет или компютър. Всичко е синхронизирано
              в реално време.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <h2>Как работи</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Регистрирай се</h3>
            <p>Създай акаунт с email и пароля си</p>
          </div>

          <div className="arrow">→</div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>Добави колата си</h3>
            <p>Въведи марка, модел и година</p>
          </div>

          <div className="arrow">→</div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>Добави услугите</h3>
            <p>Въведи датите на всяка услуга</p>
          </div>

          <div className="arrow">→</div>

          <div className="step">
            <div className="step-number">4</div>
            <h3>Получавай напомени</h3>
            <p>Email 1 месец преди изтичане</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <h2>Управлявай тези услуги</h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">🛡️</div>
            <h3>Гражданска отговорност</h3>
            <p>Задължителна застраховка за отговорност</p>
          </div>

          <div className="service-card">
            <div className="service-icon">🛣️</div>
            <h3>Винетка</h3>
            <p>Таксата за ползване на пътна мрежа</p>
          </div>

          <div className="service-card">
            <div className="service-icon">🔧</div>
            <h3>Технически преглед</h3>
            <p>Периодична проверка на техническото състояние</p>
          </div>

          <div className="service-card">
            <div className="service-icon">💎</div>
            <h3>КАСКО</h3>
            <p>Допълнителна застраховка за твоята кола</p>
          </div>

          <div className="service-card">
            <div className="service-icon">💰</div>
            <h3>Данък</h3>
            <p>Годишен данък върху превозното средство</p>
          </div>

          <div className="service-card">
            <div className="service-icon">⚙️</div>
            <h3>И много други</h3>
            <p>Лесно добавяй и управлявай всякакви услуги</p>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="example-section">
        <h2>Пример за ползване</h2>
        <div className="example-container">
          <div className="example-text">
            <h3>Как CarGuard е спасил хиляди водачи</h3>
            <ul className="example-list">
              <li>✅ Иван откри що гражданската му е изтекла 3 дни, благодарение на напомената</li>
              <li>✅ Мария никога не е пропуснала винетка поради напомените</li>
              <li>✅ Петър спести 500 лева избягвайки глоба за вреда технически преглед</li>
              <li>✅ София управлява 2 колите си лесно и без стрес</li>
            </ul>
            <p className="example-note">
              <strong>Не отлагай!</strong> Много хора имат проблеми поради пропуснати сроковете.
              CarGuard решава този проблем автоматично!
            </p>
          </div>
          <div className="example-image">
            <div className="dashboard-preview">
              <div className="dashboard-card ok">
                <span>Винетка</span>
                <p>Валидна</p>
              </div>
              <div className="dashboard-card warning">
                <span>КАСКО</span>
                <p>Изтича в 15 дни</p>
              </div>
              <div className="dashboard-card expired">
                <span>Преглед</span>
                <p>Изтекло</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Готов ли е?</h2>
        <p>Присъедини се към хиляди водачи, които вече управляват своите колни услуги с CarGuard</p>
        <button className="cta-btn-large" onClick={() => navigate('/register')}>
          Създай безплатен акаунт сега
        </button>
        <p className="small-text">Или <a href="#" onClick={() => navigate('/login')}>влез</a> ако вече имаш профил</p>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 CarGuard. Всички права запазени. | Управлявай своята кола разумно.</p>
      </footer>
    </div>
  );
};

export default Home;
