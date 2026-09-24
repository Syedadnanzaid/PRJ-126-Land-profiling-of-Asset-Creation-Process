import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import {
  IconEye, IconEyeOff, IconDatabase, IconMapPin, IconShield,
  IconCloud, IconEnvelope, IconLock, IconUsers,
  IconGlobe, IconChevronDown
} from '../icons/Icons';
import logo from '../../assets/land-asset-governance-logo.png';
import './Login.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await registerUser(name, email, password);
      // The response payload and success condition depend on backend implementation
      if (response) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Registration failed: Invalid server response.');
      }
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-overlay"></div>
        <div className="hero-brand">
          <img src={logo} alt="Land Asset Governance" className="brand-logo" />
          <h2>Land Asset Governance</h2>
          <p>Sustainable Land. Smarter Governance.</p>
        </div>
        <div className="hero-content">
          <h1>
            <div>Digitizing</div>
            <div>Land Assets for a</div>
            <div>Better Tomorrow</div>
          </h1>
          <p className="hero-description">
            A cloud-based intelligent platform for land asset governance, process profiling and sustainable development.
          </p>
        </div>
        <div className="hero-features">
          <div className="feature"><IconDatabase className="feature-icon" /> Centralized Land Records</div>
          <div className="feature"><IconMapPin className="feature-icon" /> GIS Integration</div>
          <div className="feature"><IconShield className="feature-icon" /> AI-Powered Verification</div>
          <div className="feature"><IconCloud className="feature-icon" /> Secure & Scalable</div>
        </div>
        <div className="hero-quote">
          "Transparent Land Governance for Stronger Communities"
        </div>
        <div className="hero-decoration">
          Land Builds Tomorrow
        </div>
      </div>

      <div className="login-main">
        <div className="login-topbar">
          <div className="language-control"><IconGlobe className="topbar-icon" /> English <IconChevronDown className="topbar-icon-small" /></div>
          <div className="topbar-links">
            <span>Government</span>
            <span>People</span>
            <span>A Smarter Tomorrow</span>
          </div>
        </div>

        <div className="login-card-wrapper">
          <div className="login-card">
            <div className="login-form-section">
              <h2 className="login-heading">Create Account</h2>
              <p className="login-subtitle">
                Register as an Applicant on the Land Asset Governance Platform
              </p>

              <form className="login-form" onSubmit={handleRegister}>
                {error && (
                  <div className="login-error-message">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="login-success-message" style={{ color: 'green', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#e6ffe6', border: '1px solid green', borderRadius: '4px' }}>
                    {success}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-with-icon">
                    <IconUsers className="input-icon" />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-with-icon">
                    <IconEnvelope className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper input-with-icon">
                    <IconLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrapper input-with-icon">
                    <IconLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>

                <p className="admin-contact" style={{ textAlign: 'center', marginTop: '1rem' }}>
                  Already have an account? <Link to="/login" className="contact-highlight">Login</Link>
                </p>
              </form>
            </div>

            <div className="login-benefits">
              <div className="benefit">
                <div className="benefit-icon-wrapper"><IconShield /></div>
                <div>
                  <h3>Secure Access</h3>
                  <p>Your data is protected with enterprise-grade security</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon-wrapper"><IconUsers /></div>
                <div>
                  <h3>Role-Based Access</h3>
                  <p>Access the tools and information relevant to your role</p>
                </div>
              </div>
              <div className="benefit">
                <div className="benefit-icon-wrapper"><IconCloud /></div>
                <div>
                  <h3>Anywhere, Anytime</h3>
                  <p>Access from any device with a secure connection</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} Land Asset Governance Platform
          </div>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Support</a>
          </div>
          <div className="footer-slogan">
            For a Sustainable Future
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
