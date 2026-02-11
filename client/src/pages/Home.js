import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseAuth';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      const sections = ['why', 'how', 'services', 'demo'];
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) throw error;

      setShowLoginModal(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Грешка при вход');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (registerData.password !== registerData.confirmPassword) {
      setError('Паролите не съвпадат');
      return;
    }
    setLoading(true);
    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password
      });

      if (authError) throw authError;

      // 2. Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          name: registerData.name,
          email: registerData.email,
          auth_user_id: authData.user.id
        }]);

      if (profileError) throw profileError;

      setShowRegisterModal(false);
      setError('Моля проверете имейла си за потвърждение!');
      // Don't navigate yet - user needs to confirm email
    } catch (err) {
      setError(err.message || 'Грешка при регистрация');
    } finally {
      setLoading(false);
    }
  };

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
          </nav>

          <nav className="nav-links">
            <button className="nav-btn login-btn" onClick={() => { setShowLoginModal(true); setError(''); }}>
              Вход
            </button>
            <button className="nav-btn register-btn" onClick={() => { setShowRegisterModal(true); setError(''); }}>
              Регистрирай се
            </button>
          </nav>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="auth-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            <h2>🚗 Вход в CarGuard</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email</label>
                <input 
                  type="email" 
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="Въведи email"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Парола</label>
                <input 
                  type="password" 
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="Въведи парола"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Зареждане...' : 'Влез'}
              </button>
            </form>
            <p className="auth-switch">
              Нямаш акаунт? <span onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); setError(''); }}>Регистрирай се</span>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="auth-modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegisterModal(false)}>✕</button>
            <h2>🚗 Регистрация в CarGuard</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label>Име</label>
                <input 
                  type="text" 
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  placeholder="Въведи име"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Email</label>
                <input 
                  type="email" 
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Въведи email"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Парола</label>
                <input 
                  type="password" 
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Въведи парола"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Потвърди парола</label>
                <input 
                  type="password" 
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  placeholder="Потвърди парола"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Зареждане...' : 'Регистрирай се'}
              </button>
            </form>
            <p className="auth-switch">
              Вече имаш акаунт? <span onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); setError(''); }}>Влез</span>
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero fade-in-section">
        <div className="hero-content">
          <div className="badge">🚀 Най-лесният начин да следиш сроковете</div>
          <h2>Спри да се тревожиш за глоби и пропуснати срокове</h2>
          <p>
            CarGuard ти изпраща напомняне <strong>1 месец преди</strong> да изтече гражданската, винетката, прегледът или данъкът.
            Всички твои коли и услуги на едно място.
          </p>
          <button className="cta-btn" onClick={() => setShowRegisterModal(true)}>
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
            <h3>Получаваш напомняне</h3>
            <p>Email 1 месец преди. Никога повече глоби!</p>
            <div className="step-icon">📧</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section fade-in-section">
        <div className="section-header">
          <h2>Какво можеш да следиш?</h2>
          <p>Всички важни услуги за твоя автомобил на едно място</p>
        </div>
        <div className="services-grid">
          <div className="service-card fade-in-section">
            <div className="service-icon">🔧</div>
            <h3>Технически преглед</h3>
            <p>Задължителен годишно. Без него колата не е легална на пътя!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🛡️</div>
            <h3>Гражданска отговорност</h3>
            <p>Задължителна застраховка. Глоба при липса: до 3000 лв!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">💎</div>
            <h3>КАСКО застраховка</h3>
            <p>Пълна защита при кражба, катастрофа или природни бедствия</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🛣️</div>
            <h3>Винетка</h3>
            <p>Електронна или хартиена. Глоба без нея: 300 лв!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">💰</div>
            <h3>Данък МПС</h3>
            <p>Годишен данък - плати до 30 юни за 5% отстъпка!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🧯</div>
            <h3>Заверка на пожарогасител</h3>
            <p>Задължително на 1-2 години. Необходим за преглед!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">�💨</div>
            <h3>Смяна на гуми</h3>
            <p>Зимни ↔ Летни. Следи DOT кода за износване!</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🔧</div>
            <h3>Сервизно обслужване</h3>
            <p>Смяна на масло, филтри, ремъци - всичко на едно място</p>
            <div className="service-dot"></div>
          </div>
        </div>
      </section>

      {/* Features Section - What you get */}
      <section className="features-section fade-in-section">
        <div className="section-header">
          <h2>Какво получаваш с CarGuard?</h2>
          <p>Пълен контрол над автопарка ти</p>
        </div>
        <div className="features-showcase">
          <div className="feature-item fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-dashboard">
                  <div className="mini-car-card">
                    <span className="car-emoji">🚗</span>
                    <div className="car-info">
                      <strong>BMW 320d</strong>
                      <small>CB 1234 AB • 2020</small>
                    </div>
                  </div>
                  <div className="mini-car-card">
                    <span className="car-emoji">🚙</span>
                    <div className="car-info">
                      <strong>Audi A4</strong>
                      <small>PB 5678 CD • 2019</small>
                    </div>
                  </div>
                  <div className="mini-car-card add-new">
                    <span>➕</span>
                    <span>Добави кола</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>📊 Управлявай неограничен брой коли</h3>
              <p>Семейни коли, фирмен автопарк, лизингови автомобили - всички на едно място. Всяка кола с пълна информация: марка, модел, VIN, пробег, технически данни.</p>
            </div>
          </div>

          <div className="feature-item reverse fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-calendar">
                  <div className="calendar-header">Януари 2026</div>
                  <div className="calendar-events">
                    <div className="calendar-event warning">
                      <span>⚠️</span> Гражданска - 28 дни
                    </div>
                    <div className="calendar-event ok">
                      <span>✅</span> Винетка - 180 дни
                    </div>
                    <div className="calendar-event expired">
                      <span>❌</span> Преглед - изтекъл!
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>📅 Календар с всички срокове</h3>
              <p>Виж на един поглед кое изтича скоро, кое е наред и кое вече е просрочено. Цветова индикация за бърза ориентация - зелено, жълто, червено.</p>
            </div>
          </div>

          <div className="feature-item fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-email">
                  <div className="email-header-mini">
                    <span className="email-icon">📧</span>
                    <strong>Ново напомняне от CarGuard</strong>
                  </div>
                  <div className="email-preview-content">
                    <p>🚗 <strong>BMW 320d</strong></p>
                    <p>Гражданската ти изтича след <span className="highlight">30 дни</span></p>
                    <p>Дата: 15.02.2026</p>
                    <small>Настрой напомнянията: 7, 14, 30 или 60 дни</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>📧 Автоматични email напомняния</h3>
              <p>Избери колко дни преди изтичане да получиш напомняне - 7, 14, 30 или 60 дни. Никога повече пропуснати срокове и глоби!</p>
            </div>
          </div>

          <div className="feature-item reverse fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-tech-data">
                  <div className="tech-header">⚙️ Технически данни</div>
                  <div className="tech-grid">
                    <div className="tech-item"><span>🔧</span> Дизел</div>
                    <div className="tech-item"><span>💪</span> 190 к.с.</div>
                    <div className="tech-item"><span>⚙️</span> Автоматик</div>
                    <div className="tech-item"><span>🌿</span> Euro 6</div>
                  </div>
                  <div className="tire-info">
                    <span>🛞 Гуми: 225/45 R17 • Зимни • Michelin</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>🔧 Пълни технически данни</h3>
              <p>Запиши всичко за колата: тип двигател, конски сили, скоростна кутия, евро стандарт, размер на гумите, DOT код. Имай информацията винаги под ръка!</p>
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
                    <div className="email-subject">⚠️ Напомняне: Гражданска изтича!</div>
                    <div className="email-body">
                      <p>🚗 BMW 320d</p>
                      <p>Изтича след <strong>30 дни</strong></p>
                      <p>Поднови навреме!</p>
                    </div>
                  </div>
                  <div className="email-notification">🔔</div>
                </div>
              </div>
              <h3>Получаваш напомняне</h3>
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
          <button className="cta-btn-large" onClick={() => { setShowRegisterModal(true); setError(''); }}>
            Започни безплатно сега →
          </button>
          <div className="cta-secondary">
            Вече имаш акаунт? <span className="cta-link" onClick={() => { setShowLoginModal(true); setError(''); }}>Влез тук</span>
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
