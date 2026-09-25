import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { 
  IconDashboard, IconLandAssets, IconGisMap, 
  IconDocuments, IconDuplicateDetection, IconWorkflow, IconAnalytics,
  IconFile, IconLogOut, IconList
} from '../icons/Icons';
import logo from '../../assets/land-asset-governance-logo.png';
import { getCurrentUser, logoutUser } from '../../services/authService';
import { getApplications } from '../../services/applicationService';
import { Role } from '../auth/RoleProtectedRoute';

const Sidebar = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserRole(user.role || null);
        }
      } catch (err) {
        console.error('Failed to fetch user role', err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logoutUser();
    navigate('/login');
  };

  let navItems: { name: string; path?: string; icon: ReactNode; action?: () => void }[] = [];

  if (userRole === Role.ADMIN) {
    navItems.push({ name: 'Dashboard', path: '/dashboard', icon: <IconDashboard /> });
  }

  if (userRole === Role.VERIFICATION_OFFICER || userRole === Role.ADMIN) {
    navItems.push({ name: 'Verification Queue', path: '/verification-queue', icon: <IconList /> });
  }

  if (userRole === Role.APPROVING_AUTHORITY || userRole === Role.ADMIN) {
    navItems.push({ name: 'Approval Queue', path: '/approval-queue', icon: <IconList /> });
  }

  navItems.push(
    { name: 'Land Assets', path: '/assets', icon: <IconLandAssets /> },
    { name: 'GIS Map', path: '/gis', icon: <IconGisMap /> },
    { name: 'Documents', path: '/documents', icon: <IconDocuments /> }
  );

  if (userRole !== Role.APPROVING_AUTHORITY) {
    navItems.push({ name: 'Duplicate Detection', path: '/duplicates', icon: <IconDuplicateDetection /> });
  }

  navItems.push(
    { name: 'Workflow', path: '/workflow', icon: <IconWorkflow /> },
    { name: 'Analytics', path: '/analytics', icon: <IconAnalytics /> }
  );

  const match = location.pathname.match(/^\/applications\/([a-zA-Z0-9-]+)(\/edit)?$/);
  const currentAppId = (match && match[1] && match[1] !== 'new') ? match[1] : null;

  const handleApplicationDetailsClick = async () => {
    try {
      const response = await getApplications();
      if (response && response.data && response.data.length > 0) {
        const sorted = [...response.data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestId = sorted[0].application_id;
        navigate(`/applications/${latestId}`);
      } else {
        navigate('/applications');
      }
    } catch (err) {
      console.error(err);
      navigate('/applications');
    }
  };

  if (userRole === Role.APPLICANT) {
    navItems = [
      { name: 'Applications', path: '/applications', icon: <IconDashboard /> },
      { name: 'New Application', path: '/applications/new', icon: <IconFile /> },
    ];
    
    if (currentAppId) {
      navItems.push({ name: 'Application Details', path: `/applications/${currentAppId}`, icon: <IconFile /> });
    } else {
      navItems.push({ name: 'Application Details', action: handleApplicationDetailsClick, icon: <IconFile /> });
    }
    
    navItems.push({ name: 'Official Assets', path: '/assets', icon: <IconLandAssets /> });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <img src={logo} alt="Logo" />
        </div>
        <div className="sidebar-brand-text">
          <h2>Land Asset Governance</h2>
          <p>Sustainable Land. Smarter Governance.</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              {item.action ? (
                <a href="#" onClick={(e) => { e.preventDefault(); item.action!(); }} className={location.pathname.startsWith('/applications/') && !location.pathname.endsWith('/new') ? 'active' : ''}>
                  <span className="icon">{item.icon}</span>
                  <span className="text">{item.name}</span>
                </a>
              ) : (
                <NavLink 
                  to={item.path!}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  end={item.path === '/applications'}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="text">{item.name}</span>
                </NavLink>
              )}
            </li>
          ))}
          <li style={{ marginTop: 'auto' }}>
            <a href="#" onClick={handleLogout} className="">
              <span className="icon"><IconLogOut /></span>
              <span className="text">Logout</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
