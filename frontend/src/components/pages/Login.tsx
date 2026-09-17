import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import {
  IconEye, IconEyeOff, IconDatabase, IconMapPin, IconShield,
  IconCloud, IconEnvelope, IconLock, IconBuilding, IconUsers,
  IconGlobe, IconChevronDown
} from '../icons/Icons';
import logo from '../../assets/land-asset-governance-logo.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      const res = response as unknown as { data?: { token?: string }, token?: string } | null;
      const token = res?.token || res?.data?.token;

      if (token) {
        localStorage.setItem('token', token);
        navigate('/dashboard');
      } else {
        setError('Login failed: Invalid server response.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
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
              <h2 className="login-heading">Welcome Back</h2>
              <p className="login-subtitle">
                Sign in to your Land Asset Governance Platform
              </p>

              <form className="login-form" onSubmit={handleLogin}>
                {error && (
                  <div className="login-error-message">
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-with-icon">
                    <IconEnvelope className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
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
                      placeholder="Enter your password"
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

                <div className="forgot-password">
                  <a href="#">Forgot password?</a>
                </div>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="login-divider">
                  <span>OR</span>
                </div>

                <button type="button" className="gov-sso-btn">
                  <IconBuilding /> Government SSO
                </button>

                <p className="admin-contact">
                  Need access? <span className="contact-highlight">Contact your administrator.</span>
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

export default Login;
