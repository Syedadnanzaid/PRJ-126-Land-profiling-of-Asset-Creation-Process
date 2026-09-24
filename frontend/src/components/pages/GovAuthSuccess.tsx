import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, type User } from '../../services/authService';
import {
  IconDatabase, IconMapPin, IconShield,
  IconCloud, IconGlobe, IconChevronDown, IconCheckCircle
} from '../icons/Icons';
import logo from '../../assets/land-asset-governance-logo.png';
import './Login.css';

const getHumanReadableRole = (role?: string) => {
  switch (role) {
    case 'VERIFICATION_OFFICER':
      return 'Verification Officer';
    case 'APPROVING_AUTHORITY':
      return 'Approving Authority';
    case 'ADMIN':
      return 'System Administrator';
    default:
      return 'Government Official';
  }
};

const GovAuthSuccess = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          if (isMounted) setUser(currentUser);
        } else {
          if (isMounted) navigate('/gov-login');
        }
      } catch (err) {
        if (isMounted) navigate('/gov-login');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchUser();
    return () => { isMounted = false; };
  }, [navigate]);

  const handleContinue = () => {
    if (!user) return;
    
    switch (user.role) {
      case 'VERIFICATION_OFFICER':
        navigate('/verification-queue');
        break;
      case 'APPROVING_AUTHORITY':
        navigate('/dashboard');
        break;
      case 'ADMIN':
        navigate('/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="login-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
            <div className="login-form-section" style={{ width: '100%', borderRight: 'none', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <IconCheckCircle width={64} height={64} style={{ color: '#10b981', marginBottom: '24px' }} />
              
              <h2 className="login-heading">Authentication Successful</h2>
              <p className="login-subtitle" style={{ marginBottom: '24px' }}>
                Government Employee
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '400px', textAlign: 'left', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Employee</span>
                    <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 500 }}>{user.name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Department</span>
                    <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 500 }}>Land Administration</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Access</span>
                    <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 500 }}>{getHumanReadableRole(user.role)}</span>
                  </div>
                </div>
              </div>

              <p style={{ color: '#059669', fontSize: '0.95rem', fontWeight: 500, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconShield width={20} height={20} />
                Your government identity has been successfully authenticated.
              </p>

              <button 
                onClick={handleContinue} 
                className="login-submit-btn" 
                style={{ width: '100%', maxWidth: '400px' }}
              >
                Continue to Platform
              </button>

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

export default GovAuthSuccess;
