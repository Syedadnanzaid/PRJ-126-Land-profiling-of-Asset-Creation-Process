import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, getCurrentUser } from '../../services/authService';
import {
  IconEye, IconEyeOff, IconDatabase, IconMapPin, IconShield,
  IconCloud, IconEnvelope, IconLock, IconGlobe, IconChevronDown
} from '../icons/Icons';
import logo from '../../assets/land-asset-governance-logo.png';
import './Login.css';

const GovLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both Official Email / Employee ID and password.');
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
        try {
          const user = await getCurrentUser();
          
          if (user && (user.role === 'VERIFICATION_OFFICER' || user.role === 'APPROVING_AUTHORITY' || user.role === 'ADMIN')) {
            navigate('/gov-auth-success');
          } else {
            // Revert token and logout if unauthorized
            localStorage.removeItem('token');
            setError('This sign-in is restricted to authorized government personnel.');
          }
        } catch (e) {
          localStorage.removeItem('token');
          setError('Failed to retrieve user information.');
        }
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
            <div className="login-form-section" style={{ width: '100%', borderRight: 'none' }}>
              <h2 className="login-heading">Government Authentication</h2>
              <p className="login-subtitle">
                Secure access for authorized government personnel.
              </p>

              <form className="login-form" onSubmit={handleLogin}>
                {error && (
                  <div className="login-error-message">
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Official Email / Employee ID</label>
                  <div className="input-with-icon">
                    <IconEnvelope className="input-icon" />
                    <input
                      type="text"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@gov.test"
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

                <button type="submit" className="login-submit-btn" disabled={loading} style={{ marginTop: '12px' }}>
                  {loading ? 'Authenticating...' : 'Secure Sign In'}
                </button>

                <p className="admin-contact" style={{ textAlign: 'center', marginTop: '24px' }}>
                  <IconShield width={16} height={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                  Authorized government personnel only.
                </p>
                
                <p className="admin-contact" style={{ marginTop: '16px' }}>
                  <Link to="/login" className="contact-highlight">&larr; Back to Applicant Login</Link>
                </p>
              </form>
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

export default GovLogin;
