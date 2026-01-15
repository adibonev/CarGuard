import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger animations on scroll
    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-in-section');
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call on load
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <section className="hero fade-in-section">
        <div className="hero-content">
          <div className="badge">Управлявай своята кола умно</div>
          <h2>Никогда не забравяй важните срокове</h2>
          <p>
            CarGuard е твоят персонален асистент за управление на всички автомобилни услуги.
            Автоматични напомени 1 месец преди изтичане - всички данни на един клик.
          </p>
          <button className="cta-btn" onClick={() => navigate('/register')}>
            Започни безплатно сега →
          </button>
          <div className="hero-features">
            <span>✓ Безплатна регистрация</span>
            <span>✓ Без кредитна карта</span>
            <span>✓ Моментален достъп</span>
          </div>
        </div>
        <div className="hero-image">
          <div className="car-icon animated">🏎️</div>
          <div className="floating-element">📱</div>
          <div className="floating-element" style={{animationDelay: '1s'}}>✓</div>
        </div>
      </section>

      {/* Why Section */}
      <section className="why-section fade-in-section">
        <div className="section-header">
          <h2>Защо хиляди водачи избират CarGuard?</h2>
          <p>Всичко което ти трябва, всичко на едно място</p>
        </div>
        <div className="why-grid">
          <div className="why-card fade-in-section">
            <div className="why-icon">⏰</div>
            <h3>Умни напомени</h3>
            <p>
              Email уведомления точно 30 дни преди изтичане на всяка услуга.
              Достатъчно време да подновиш всичко без стрес.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">📋</div>
            <h3>Централизирано управление</h3>
            <p>
              Един профил за неограничен брой коли. Управлявай всички услуги:
              гражданска, винетка, преглед, каско, данък.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">🚨</div>
            <h3>Избегни проблеми</h3>
            <p>
              Никада повече пропуснати срокове. Избегни глобите и административните процедури.
              Всичко е под твой контрол.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">💰</div>
            <h3>Оптимизирай разходите</h3>
            <p>
              Подновявай услугите навреме и получавай по-добри цени.
              Избегни скъпи наказания и финансови загуби.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">🔐</div>
            <h3>Защита на данните</h3>
            <p>
              Твоята информация е криптирана и защитена с най-новите стандарти за сигурност.
              Никой няма достъп без твоето разрешение.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">📱</div>
            <h3>Достъп откъдто угодно</h3>
            <p>
              Web, мобилен, таблет - всичко е синхронизирано в реално време.
              Управлявай своята кола дори в пътя.
            </p>
            <div className="card-accent"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section fade-in-section">
        <div className="section-header">
          <h2>Как работи CarGuard</h2>
          <p>4 прости стъпки до перфектния контрол</p>
        </div>
        <div className="steps">
          <div className="step fade-in-section">
            <div className="step-number">1</div>
            <h3>Регистрирайте се</h3>
            <p>Създайте профил с email и парола в под 1 минута</p>
            <div className="step-icon">👤</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">2</div>
            <h3>Добавете своята кола</h3>
            <p>Въведете марка, модел и година на автомобила</p>
            <div className="step-icon">🚗</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">3</div>
            <h3>Регистрирайте услугите</h3>
            <p>Въведете датата на изтичане на всяка услуга</p>
            <div className="step-icon">📅</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">4</div>
            <h3>Получавайте напомени</h3>
            <p>Email 1 месец преди - всичко под контрол</p>
            <div className="step-icon">📧</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section fade-in-section">
        <div className="section-header">
          <h2>Управлявайте всички услуги на едно място</h2>
          <p>От гражданска отговорност до данък - всичко в CarGuard</p>
        </div>
        <div className="services-grid">
          <div className="service-card fade-in-section">
            <div className="service-icon">🛡️</div>
            <h3>Гражданска отговорност</h3>
            <p>Задължителна застраховка за отговорност на всеки водач</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🛣️</div>
            <h3>Винетка</h3>
            <p>Таксата за ползване на пътната мрежа - никогда не забравяй</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🔧</div>
            <h3>Технически преглед</h3>
            <p>Периодична проверка на техническото състояние на колата</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">💎</div>
            <h3>КАСКО застраховка</h3>
            <p>Допълнителна защита за твоя автомобил при щети</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">💰</div>
            <h3>Транспортен данък</h3>
            <p>Годишният данък върху превозното средство в България</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">⚙️</div>
            <h3>Произволни услуги</h3>
            <p>Добави всякакви други услуги, които искаш да проследяваш</p>
            <div className="service-dot"></div>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section className="example-section fade-in-section">
        <div className="section-header">
          <h2>История на успеха</h2>
          <p>Как CarGuard помага на реални хора</p>
        </div>
        <div className="example-container">
          <div className="example-text fade-in-section">
            <h3>Защо избраха CarGuard?</h3>
            <ul className="example-list">
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>Иван М.</strong> - Открил е че гражданската му изтича в 3 дни благодарение на напомената
                </div>
              </li>
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>Мария П.</strong> - Управлява 2 коли без стрес, всичко автоматизирано
                </div>
              </li>
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>Петър К.</strong> - Спести 500 лева избягвайки глоба за пропусната винетка
                </div>
              </li>
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>София В.</strong> - Пропуска по-малко сроковете, спокойна е с управлението
                </div>
              </li>
            </ul>
            <div className="example-highlight">
              <strong>💡 Интересен факт:</strong> 78% от водачите пропускат поне един срок годишно.
              Не бъди сред тях - присъедини се към CarGuard!
            </div>
          </div>
          <div className="example-image fade-in-section">
            <div className="stats-box">
              <div className="stat-card">
                <div className="stat-number">10k+</div>
                <div className="stat-label">Активни потребители</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50k+</div>
                <div className="stat-label">Управлявани услуги</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">95%</div>
                <div className="stat-label">Удовлетворение</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section fade-in-section">
        <div className="cta-content">
          <h2>Готов ли си да отнемеш контрол?</h2>
          <p>Присъедини се към хиляди водачи които вече управляват своите услуги с CarGuard</p>
          <button className="cta-btn-large" onClick={() => navigate('/register')}>
            Създай безплатен акаунт сега
          </button>
          <div className="cta-secondary">
            Или <a onClick={() => navigate('/login')}>влез</a> ако вече имаш профил
          </div>
        </div>
        <div className="cta-decoration">
          <div className="circle"></div>
          <div className="circle"></div>
          <div className="circle"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 CarGuard. Всички права запазени. | Управлявай своята кола разумно.</p>
        <div className="footer-links">
          <a href="#privacy">Политика на поверителност</a>
          <span>•</span>
          <a href="#terms">Условия на ползване</a>
          <span>•</span>
          <a href="#contact">Свържи се с нас</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
