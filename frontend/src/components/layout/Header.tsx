import './Header.css';
import { IconBell } from '../icons/Icons';

const Header = () => {
  return (
    <header className="header">
      <div className="header-title">
        <h1>Cloud-Based Intelligent Platform for Digital Land Asset Governance & Process Profiling</h1>
      </div>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Notifications" type="button">
          <IconBell />
          <span className="badge-dot"></span>
        </button>
        <button className="header-profile" aria-label="User Profile" type="button">
          <div className="avatar">A</div>
          <span className="username">Admin User</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
