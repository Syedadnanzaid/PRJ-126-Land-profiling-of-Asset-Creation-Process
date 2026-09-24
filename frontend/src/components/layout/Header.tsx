import { useState, useEffect } from 'react';
import './Header.css';
import { IconBell } from '../icons/Icons';
import { getCurrentUser } from '../../services/authService';
import type { User } from '../../services/authService';

const Header = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to fetch user for header', err);
      }
    };
    fetchUser();
  }, []);

  const userName = user?.name || 'Admin User';
  const initial = userName.charAt(0).toUpperCase();

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
          <div className="avatar">{initial}</div>
          <span className="username">{userName}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
