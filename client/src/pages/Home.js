import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, signInWithGoogle } from '../lib/supabaseAuth';
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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
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

      // Check if email confirmation is required
      if (authData.user && !authData.user.confirmed_at) {
        setShowRegisterModal(false);
        alert('✅ Registration successful!\n\nPlease check your email (' + registerData.email + ') to confirm.');
      } else {
        // Auto login if no confirmation needed
        setShowRegisterModal(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
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
              Why CarGuard
            </button>
            <button 
              className={`nav-tab ${activeSection === 'how' ? 'active' : ''}`}
              onClick={() => scrollToSection('how')}
            >
              How it works
            </button>
            <button 
              className={`nav-tab ${activeSection === 'services' ? 'active' : ''}`}
              onClick={() => scrollToSection('services')}
            >
              Services
            </button>
            <button 
              className={`nav-tab ${activeSection === 'demo' ? 'active' : ''}`}
              onClick={() => scrollToSection('demo')}
            >
              Demo
            </button>
          </nav>

          <nav className="nav-links">
            <button className="nav-btn login-btn" onClick={() => { setShowLoginModal(true); setError(''); }}>
              Log in
            </button>
            <button className="nav-btn register-btn" onClick={() => { setShowRegisterModal(true); setError(''); }}>
              Sign up
            </button>
          </nav>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="auth-modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLoginModal(false)}>✕</button>
            <h2>🚗 Log in to CarGuard</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email</label>
                <input 
                  type="email" 
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input 
                  type="password" 
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="Enter password"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Loading...' : 'Log in'}
              </button>
            </form>
            <div className="oauth-divider">
              <span>or</span>
            </div>
            <button 
              type="button" 
              className="google-btn"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError('Google sign-in failed. Please try again.');
                }
              }}
            >
              Sign in with Google
            </button>
            <p className="auth-switch">
              Don't have an account? <span onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); setError(''); }}>Sign up</span>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="auth-modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegisterModal(false)}>✕</button>
            <h2>🚗 Create your CarGuard account</h2>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label>Name</label>
                <input 
                  type="text" 
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Email</label>
                <input 
                  type="email" 
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input 
                  type="password" 
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="auth-field">
                <label>Confirm password</label>
                <input 
                  type="password" 
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Loading...' : 'Sign up'}
              </button>
            </form>
            <div className="oauth-divider">
              <span>or</span>
            </div>
            <button 
              type="button" 
              className="google-btn"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err) {
                  setError('Google sign-up failed. Please try again.');
                }
              }}
            >
              Sign up with Google
            </button>
            <p className="auth-switch">
              Already have an account? <span onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); setError(''); }}>Log in</span>
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero fade-in-section">
        <div className="hero-content">
          <div className="badge">🚀 The easiest way to track deadlines</div>
          <h2>Stop worrying about fines and missed deadlines</h2>
          <p>
            CarGuard sends you a reminder <strong>1 month before</strong> your insurance, vignette, inspection, or tax expires.
            All your vehicles and services in one place.
          </p>
          <button className="cta-btn" onClick={() => setShowRegisterModal(true)}>
            Start free now →
          </button>
          <div className="hero-features">
            <span>✓ 100% Free</span>
            <span>✓ No credit card</span>
            <span>✓ Ready in 30 seconds</span>
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
                <div className="demo-nav-item active">🏠 Dashboard</div>
                <div className="demo-nav-item">🚘 Vehicles</div>
                <div className="demo-nav-item">⚙️ Settings</div>
              </div>
              <div className="demo-main">
                <div className="demo-car-header">
                  <span>🚗 BMW 320d (2020)</span>
                  <span className="demo-plate">CB 1234 AB</span>
                </div>
                <div className="demo-services-list">
                  <div className="demo-service-item ok">
                    <span>🛡️ Civil Liability</span>
                    <span className="demo-status">✅ OK - 245 days</span>
                  </div>
                  <div className="demo-service-item warning">
                    <span>🛣️ Vignette</span>
                    <span className="demo-status">⚠️ 28 days</span>
                  </div>
                  <div className="demo-service-item expired">
                    <span>🔧 Inspection</span>
                    <span className="demo-status">❌ Expired!</span>
                  </div>
                  <div className="demo-service-item ok">
                    <span>💰 Tax</span>
                    <span className="demo-status">✅ OK - 180 days</span>
                  </div>
                </div>
                <div className="demo-email-preview">
                  <div className="email-badge">📧</div>
                  <div>
                    <strong>New reminder</strong>
                    <small>Your vignette is expiring</small>
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
          <h2>Why thousands of drivers already chose CarGuard</h2>
          <p>Everything you need in one place</p>
        </div>
        <div className="why-grid">
          <div className="why-card fade-in-section">
            <div className="why-icon">⏰</div>
            <h3>No more missed deadlines</h3>
            <p>
              Get an email exactly 30 days before expiration.
              Plenty of time to renew without stress.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">📋</div>
            <h3>All cars, one profile</h3>
            <p>
              Have 2, 3, or 5 cars? No problem! Manage everything from one account:
              insurance, vignette, inspection, casco, tax.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">💸</div>
            <h3>Save money on fines</h3>
            <p>
              Fine for expired insurance? Up to 3000 BGN. For vignette? 300 BGN.
              CarGuard protects you from these costs.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">⚡</div>
            <h3>Ready in 30 seconds</h3>
            <p>
              Sign up, add a car, enter services.
              That’s it — from there we handle the rest.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">🔒</div>
            <h3>Your data is protected</h3>
            <p>
              Encrypted passwords, secure connection.
              No one can access your data without your permission.
            </p>
            <div className="card-accent"></div>
          </div>

          <div className="why-card fade-in-section">
            <div className="why-icon">🌐</div>
            <h3>Access from anywhere</h3>
            <p>
              Phone, tablet, computer — everything is synced.
              Check deadlines even from the gas station.
            </p>
            <div className="card-accent"></div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="how-section fade-in-section">
        <div className="section-header">
          <h2>How it works</h2>
          <p>4 simple steps and you’re ready</p>
        </div>
        <div className="steps">
          <div className="step fade-in-section">
            <div className="step-number">1</div>
            <h3>Sign up</h3>
            <p>Just email and password. Takes 30 seconds.</p>
            <div className="step-icon">👤</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">2</div>
            <h3>Add your car</h3>
            <p>Brand, model, year. Add as many as you like.</p>
            <div className="step-icon">🚗</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">3</div>
            <h3>Enter deadlines</h3>
            <p>When insurance, vignette, inspection, etc. expire.</p>
            <div className="step-icon">📅</div>
          </div>

          <div className="arrow-connector">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M 0 10 Q 25 5, 50 10 T 100 10" stroke="#dc3545" strokeWidth="2" fill="none"/>
            </svg>
          </div>

          <div className="step fade-in-section">
            <div className="step-number">4</div>
            <h3>Get reminders</h3>
            <p>Email 1 month before. No more fines!</p>
            <div className="step-icon">📧</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section fade-in-section">
        <div className="section-header">
          <h2>What can you track?</h2>
          <p>All important vehicle services in one place</p>
        </div>
        <div className="services-grid">
          <div className="service-card fade-in-section">
            <div className="service-icon">🔧</div>
            <h3>Technical Inspection</h3>
            <p>Mandatory yearly. Without it, the car isn’t legal on the road.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🛡️</div>
            <h3>Civil Liability Insurance</h3>
            <p>Mandatory insurance. Fine if missing: up to 3000 BGN.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">💎</div>
            <h3>CASCO Insurance</h3>
            <p>Full protection for theft, accidents, or natural disasters.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🛣️</div>
            <h3>Vignette</h3>
            <p>Electronic or paper. Fine without it: 300 BGN.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">💰</div>
            <h3>Vehicle Tax</h3>
            <p>Annual tax — pay by June 30 for a 5% discount.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🧯</div>
            <h3>Fire Extinguisher Check</h3>
            <p>Required every 1–2 years. Needed for inspection.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">�💨</div>
            <h3>Tire Change</h3>
            <p>Winter ↔ Summer. Track DOT wear and age.</p>
            <div className="service-dot"></div>
          </div>

          <div className="service-card fade-in-section">
            <div className="service-icon">🔧</div>
            <h3>Service Maintenance</h3>
            <p>Oil, filters, belts — everything in one place.</p>
            <div className="service-dot"></div>
          </div>
        </div>
      </section>

      {/* Features Section - What you get */}
      <section className="features-section fade-in-section">
        <div className="section-header">
          <h2>What do you get with CarGuard?</h2>
          <p>Full control over your vehicles</p>
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
                    <span>Add vehicle</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>📊 Manage unlimited vehicles</h3>
              <p>Family cars, company fleet, leased vehicles — all in one place. Each car with full details: brand, model, VIN, mileage, technical data.</p>
            </div>
          </div>

          <div className="feature-item reverse fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-calendar">
                  <div className="calendar-header">January 2026</div>
                  <div className="calendar-events">
                    <div className="calendar-event warning">
                      <span>⚠️</span> Civil Liability - 28 days
                    </div>
                    <div className="calendar-event ok">
                      <span>✅</span> Vignette - 180 days
                    </div>
                    <div className="calendar-event expired">
                      <span>❌</span> Inspection - expired!
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>📅 Calendar for all deadlines</h3>
              <p>See at a glance what expires soon, what’s OK, and what’s overdue. Color cues for quick orientation — green, yellow, red.</p>
            </div>
          </div>

          <div className="feature-item fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-email">
                  <div className="email-header-mini">
                    <span className="email-icon">📧</span>
                    <strong>New reminder from CarGuard</strong>
                  </div>
                  <div className="email-preview-content">
                    <p>🚗 <strong>BMW 320d</strong></p>
                    <p>Your insurance expires in <span className="highlight">30 days</span></p>
                    <p>Date: 15.02.2026</p>
                    <small>Set reminders: 7, 14, 30, or 60 days</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>📧 Automatic email reminders</h3>
              <p>Choose how many days before expiration to receive a reminder — 7, 14, 30, or 60 days. Never miss a deadline again.</p>
            </div>
          </div>

          <div className="feature-item reverse fade-in-section">
            <div className="feature-visual">
              <div className="feature-screen">
                <div className="mini-tech-data">
                  <div className="tech-header">⚙️ Technical data</div>
                  <div className="tech-grid">
                    <div className="tech-item"><span>🔧</span> Diesel</div>
                    <div className="tech-item"><span>💪</span> 190 HP</div>
                    <div className="tech-item"><span>⚙️</span> Automatic</div>
                    <div className="tech-item"><span>🌿</span> Euro 6</div>
                  </div>
                  <div className="tire-info">
                    <span>🛞 Tires: 225/45 R17 • Winter • Michelin</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="feature-text">
              <h3>🔧 Full technical details</h3>
              <p>Record everything about your car: engine type, horsepower, transmission, euro standard, tire size, DOT code. Always have the info handy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="demo-section fade-in-section">
        <div className="section-header">
          <h2>🎬 See how CarGuard works</h2>
          <p>Step-by-step demonstration</p>
        </div>
        <div className="demo-container">
          <div className="demo-steps">
            <div className="demo-step fade-in-section">
              <div className="demo-step-number">1</div>
              <div className="demo-animation">
                <div className="demo-screen">
                  <div className="demo-header">🚗 CarGuard - Sign up</div>
                  <div className="demo-form">
                    <div className="demo-input typing">👤 Name: Ivan Petrov</div>
                    <div className="demo-input typing" style={{animationDelay: '1s'}}>📧 Email: ivan@email.com</div>
                    <div className="demo-input typing" style={{animationDelay: '2s'}}>🔒 Password: ********</div>
                    <div className="demo-button pulse-btn">Sign up</div>
                  </div>
                </div>
              </div>
              <h3>Create an account</h3>
              <p>Registration is free and takes only 30 seconds</p>
            </div>

            <div className="demo-step fade-in-section">
              <div className="demo-step-number">2</div>
              <div className="demo-animation">
                <div className="demo-screen">
                  <div className="demo-header">🚗 Add vehicle</div>
                  <div className="demo-form">
                    <div className="demo-input typing">🎨 Brand: BMW</div>
                    <div className="demo-input typing" style={{animationDelay: '0.8s'}}>🚘 Model: 320d</div>
                    <div className="demo-input typing" style={{animationDelay: '1.6s'}}>📅 Year: 2020</div>
                    <div className="demo-button pulse-btn">Add vehicle</div>
                  </div>
                </div>
              </div>
              <h3>Add your vehicle</h3>
              <p>Enter your vehicle information</p>
            </div>

            <div className="demo-step fade-in-section">
              <div className="demo-step-number">3</div>
              <div className="demo-animation">
                <div className="demo-screen">
                  <div className="demo-header">📝 Add service</div>
                  <div className="demo-form">
                    <div className="demo-select">
                      <span>🛡️ Civil Liability Insurance</span>
                      <span className="dropdown-icon">▼</span>
                    </div>
                    <div className="demo-input typing">📅 Expires: 15.03.2026</div>
                    <div className="demo-button pulse-btn">Save service</div>
                  </div>
                </div>
              </div>
              <h3>Add services</h3>
              <p>Choose type and expiration date</p>
            </div>

            <div className="demo-step fade-in-section">
              <div className="demo-step-number">4</div>
              <div className="demo-animation">
                <div className="demo-screen email-screen">
                  <div className="demo-header">📧 New Email</div>
                  <div className="email-content">
                    <div className="email-from">From: CarGuard</div>
                    <div className="email-subject">⚠️ Reminder: Insurance expiring!</div>
                    <div className="email-body">
                      <p>🚗 BMW 320d</p>
                      <p>Expires in <strong>30 days</strong></p>
                      <p>Renew on time!</p>
                    </div>
                  </div>
                  <div className="email-notification">🔔</div>
                </div>
              </div>
              <h3>Get a reminder</h3>
              <p>Email 1 month before expiration</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section fade-in-section">
        <div className="cta-content">
          <h2>🚀 Ready to forget about fines?</h2>
          <p>Registration is <strong>100% free</strong> and takes only 30 seconds. Join 10,000+ drivers!</p>
          <button className="cta-btn-large" onClick={() => { setShowRegisterModal(true); setError(''); }}>
            Start free now →
          </button>
          <div className="cta-secondary">
            Already have an account? <span className="cta-link" onClick={() => { setShowLoginModal(true); setError(''); }}>Log in here</span>
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
        <p>&copy; 2026 CarGuard. All rights reserved. | Manage your car wisely.</p>
        <div className="footer-links">
          <a href="#privacy">Privacy Policy</a>
          <span>•</span>
          <a href="#terms">Terms of Use</a>
          <span>•</span>
          <a href="#contact">Contact Us</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
