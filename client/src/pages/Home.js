import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

      // Update active section for navigation highlight
      const sections = ['why', 'how', 'services', 'demo', 'testimonials'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
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
          <h1 className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>🚗 CarGuard</h1>
          
          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${activeSection === 'why' ? 'active' : ''}`}
              onClick={() => scrollToSection('why')}
            >
              Защо CarGuard
            </button>
            <button 
              className={`nav-tab ${activeSection === 'how' ? 'active' : ''}`}
              onClick={() => scrollToSection('how')}
            >
              Как работи
            </button>
            <button 
              className={`nav-tab ${activeSection === 'services' ? 'active' : ''}`}
              onClick={() => scrollToSection('services')}
            >
              Услуги
            </button>
            <button 
              className={`nav-tab ${activeSection === 'demo' ? 'active' : ''}`}
              onClick={() => scrollToSection('demo')}
            >
              Демо
            </button>
            <button 
              className={`nav-tab ${activeSection === 'testimonials' ? 'active' : ''}`}
              onClick={() => scrollToSection('testimonials')}
            >
              Отзиви
            </button>
          </nav>

          <nav className="nav-links">
            <button className="nav-btn login-btn" onClick={() => navigate('/login')}>
              Вход
            </button>
            <button className="nav-btn register-btn" onClick={() => navigate('/register')}>
              Регистрирай се
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero fade-in-section">
        <div className="hero-content">
          <div className="badge">🚀 Най-лесният начин да следиш сроковете</div>
          <h2>Спри да се тревожиш за глоби и пропуснати срокове</h2>
          <p>
            CarGuard ти изпраща напомена <strong>1 месец преди</strong> да изтече гражданската, винетката, прегледът или данъкът.
            Всички твои коли и услуги на едно място.
          </p>
          <button className="cta-btn" onClick={() => navigate('/register')}>
            Започни безплатно сега →
          </button>
          <div className="hero-features">
            <span>✓ 100% Безплатно</span>
            <span>✓ Без кредитна карта</span>
            <span>✓ Готово за 30 секунди</span>
          </div>
        </div>
        <div className="hero-demo">
          <div className="hero-demo-screen">
            <div className="demo-browser-bar">
              <div className="browser-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="browser-url">carguard.bg/dashboard</div>
            </div>
            <div className="demo-dashboard">
              <div className="demo-sidebar">
                <div className="demo-logo">🚗 CarGuard</div>
                <div className="demo-nav-item active">🏠 Табло</div>
                <div className="demo-nav-item">🚘 Коли</div>
                <div className="demo-nav-item">⚙️ Настройки</div>
              </div>
              <div className="demo-main">
                <div className="demo-car-header">
                  <span>🚗 BMW 320d (2020)</span>
                  <span className="demo-plate">CB 1234 AB</span>
                </div>
                <div className="demo-services-list">
                  <div className="demo-service-item ok">
                    <span>🛡️ Гражданска</span>
                    <span className="demo-status">✅ OK - 245 дни</span>
                  </div>
                  <div className="demo-service-item warning">
                    <span>🛣️ Винетка</span>
                    <span className="demo-status">⚠️ 28 дни</span>
                  </div>
                  <div className="demo-service-item expired">
                    <span>🔧 Преглед</span>
                    <span className="demo-status">❌ Изтекъл!</span>
                  </div>
                  <div className="demo-service-item ok">
                    <span>💰 Данък</span>
                    <span className="demo-status">✅ OK - 180 дни</span>
                  </div>
                </div>
                <div className="demo-email-preview">
                  <div className="email-badge">📧</div>
                  <div>
                    <strong>Ново напомняне</strong>
                    <small>Винетката Ви изтича</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section id="why" className="why-section fade-in-section">
        <div className="section-header">
          <h2>Защо хиляди водачи вече избраха CarGuard?</h2>
          <p>Всичко, което ти трябва, на едно място</p>
        </div>
        <div className="why-grid">
          <div className="why-card fade-in-section">
            <div className="why-icon">⏰</div>
            <h3>Никога повече закъснения</h3>
            <p>
              Получаваш email точно 30 дни преди изтичане.
              Достатъчно време да подновиш без стрес.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">📋</div>
            <h3>Всички коли, един профил</h3>
            <p>
              Имаш 2, 3 или 5 коли? Без проблем! Управлявай всички от един акаунт:
              гражданска, винетка, преглед, каско, данък.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">💸</div>
            <h3>Спести пари от глоби</h3>
            <p>
              Глоба за изтекла гражданска? До 3000 лв. За винетка? 300 лв.
              CarGuard те предпазва от тези разходи.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">⚡</div>
            <h3>Готово за 30 секунди</h3>
            <p>
              Регистрация, добавяне на кола, въвеждане на услуги.
              Това е всичко - оттук нататък работим ние.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">🔒</div>
            <h3>Твоите данни са защитени</h3>
            <p>
              Криптирана парола, защитена връзка.
              Никой няма достъп до твоите данни без твоето разрешение.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">🌐</div>
            <h3>Достъп отвсякъде</h3>
            <p>
              Телефон, таблет, компютър - всичко е синхронизирано.
              Провери сроковете дори от бензиностанцията.
            </p>
            <div className="card-accent"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="how-section fade-in-section">
        <div className="section-header">
          <h2>Как работи?</h2>
          <p>4 прости стъпки и си готов!</p>
        </div>
        <div className="steps">
          <div className="step fade-in-section">
            <div className="step-number">1</div>
            <h3>Регистрирай се</h3>
            <p>Само email и парола. Отнема 30 секунди.</p>
            <div className="step-icon">👤</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">2</div>
            <h3>Добави колата си</h3>
            <p>Марка, модел, година. Можеш да добавиш колкото искаш.</p>
            <div className="step-icon">🚗</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">3</div>
            <h3>Въведи сроковете</h3>
            <p>Кога изтича гражданската, винетката, прегледът...</p>
            <div className="step-icon">📅</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">4</div>
            <h3>Получаваш напомена</h3>
            <p>Email 1 месец преди. Никога повече глоби!</p>
            <div className="step-icon">📧</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section fade-in-section">
        <div className="section-header">
          <h2>Какво можеш да следиш?</h2>
          <p>Всички важни услуги за твоя автомобил</p>
        </div>
        <div className="services-grid">
          <div className="service-card fade-in-section">
            <div className="service-icon">🛡️</div>
            <h3>Гражданска отговорност</h3>
            <p>Задължителна застраховка. Глоба при липса: до 3000 лв!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🛣️</div>
            <h3>Винетка</h3>
            <p>Годишна такса за пътната мрежа. Глоба: 300 лв!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🔧</div>
            <h3>Технически преглед</h3>
            <p>Задължителен всяка година. Без него - без застраховка!</p>
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
            <h3>Данък МПС</h3>
            <p>Годишен данък върху превозното средство</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">➕</div>
            <h3>Други услуги</h3>
            <p>Добави каквото искаш: смяна на масло, гуми...</p>
            <div className="service-dot"></div>
          </div>
        </div>
      </section>

      {/* Example Section */}
      <section id="testimonials" className="example-section fade-in-section">
        <div className="section-header">
          <h2>Реални истории от наши потребители</h2>
          <p>Виж как CarGuard помага на хора като теб</p>
        </div>
        <div className="example-container">
          <div className="example-text fade-in-section">
            <h3>Те вече избраха CarGuard:</h3>
            <ul className="example-list">
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>Иван М.</strong> - "Открих, че гражданската ми изтича след 3 дни! Спасиха ме от глоба 3000 лв."
                </div>
              </li>
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>Мария П.</strong> - "Управлявам 2 коли без стрес. Всичко е автоматизирано!"
                </div>
              </li>
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>Петър К.</strong> - "Спестих 500 лв от глоба за пропусната винетка."
                </div>
              </li>
              <li>
                <span className="example-icon">✅</span>
                <div>
                  <strong>София В.</strong> - "Най-после не се стресирам за срокове. Супер лесно!"
                </div>
              </li>
            </ul>
            <div className="example-highlight">
              <strong>💡 Знаеш ли?</strong> 78% от водачите пропускат поне един срок годишно.
              Не бъди сред тях - започни сега!
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
                <div className="stat-label">Следени услуги</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">95%</div>
                <div className="stat-label">Доволни клиенти</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="demo-section fade-in-section">
        <div className="section-header">
          <h2>🎬 Виж как работи CarGuard</h2>
          <p>Стъпка по стъпка демонстрация</p>
        </div>
        <div className="demo-container">
          <div className="demo-steps">
            <div className="demo-step fade-in-section">
              <div className="demo-step-number">1</div>
              <div className="demo-animation">
                <div className="demo-screen">
                  <div className="demo-header">🚗 CarGuard - Регистрация</div>
                  <div className="demo-form">
                    <div className="demo-input typing">👤 Име: Иван Петров</div>
                    <div className="demo-input typing" style={{animationDelay: '1s'}}>📧 Email: ivan@email.com</div>
                    <div className="demo-input typing" style={{animationDelay: '2s'}}>🔒 Парола: ********</div>
                    <div className="demo-button pulse-btn">Регистрирай се</div>
                  </div>
                </div>
              </div>
              <h3>Създай акаунт</h3>
              <p>Регистрацията е безплатна и отнема само 30 секунди</p>
            </div>

            <div className="demo-step fade-in-section">
              <div className="demo-step-number">2</div>
              <div className="demo-animation">
                <div className="demo-screen">
                  <div className="demo-header">🚗 Добави кола</div>
                  <div className="demo-form">
                    <div className="demo-input typing">🎨 Марка: BMW</div>
                    <div className="demo-input typing" style={{animationDelay: '0.8s'}}>🚘 Модел: 320d</div>
                    <div className="demo-input typing" style={{animationDelay: '1.6s'}}>📅 Година: 2020</div>
                    <div className="demo-button pulse-btn">Добави кола</div>
                  </div>
                </div>
              </div>
              <h3>Добави своята кола</h3>
              <p>Въведи информация за твоя автомобил</p>
            </div>

            <div className="demo-step fade-in-section">
              <div className="demo-step-number">3</div>
              <div className="demo-animation">
                <div className="demo-screen">
                  <div className="demo-header">📝 Добави услуга</div>
                  <div className="demo-form">
                    <div className="demo-select">
                      <span>🛡️ Гражданска отговорност</span>
                      <span className="dropdown-icon">▼</span>
                    </div>
                    <div className="demo-input typing">📅 Изтича: 15.03.2026</div>
                    <div className="demo-button pulse-btn">Съхрани услуга</div>
                  </div>
                </div>
              </div>
              <h3>Добави услуги</h3>
              <p>Избери тип и дата на изтичане</p>
            </div>

            <div className="demo-step fade-in-section">
              <div className="demo-step-number">4</div>
              <div className="demo-animation">
                <div className="demo-screen email-screen">
                  <div className="demo-header">📧 Нов Email</div>
                  <div className="email-content">
                    <div className="email-from">От: CarGuard</div>
                    <div className="email-subject">⚠️ Напомена: Гражданска изтича!</div>
                    <div className="email-body">
                      <p>🚗 BMW 320d</p>
                      <p>Изтича след <strong>30 дни</strong></p>
                      <p>Поднови навреме!</p>
                    </div>
                  </div>
                  <div className="email-notification">🔔</div>
                </div>
              </div>
              <h3>Получаваш напомена</h3>
              <p>Email 1 месец преди изтичане</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section fade-in-section">
        <div className="cta-content">
          <h2>🚀 Готов ли си да забравиш за глобите?</h2>
          <p>Регистрацията е <strong>100% безплатна</strong> и отнема само 30 секунди. Присъедини се към 10,000+ водачи!</p>
          <button className="cta-btn-large" onClick={() => navigate('/register')}>
            Започни безплатно сега →
          </button>
          <div className="cta-secondary">
            Вече имаш акаунт? <a onClick={() => navigate('/login')}>Влез тук</a>
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
