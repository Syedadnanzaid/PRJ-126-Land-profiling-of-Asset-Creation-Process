import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { 
  IconDashboard, IconLandAssets, IconGisMap, 
  IconDocuments, IconDuplicateDetection, IconWorkflow, IconAnalytics 
} from '../icons/Icons';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <IconDashboard /> },
    { name: 'Land Assets', path: '/assets', icon: <IconLandAssets /> },
    { name: 'GIS Map', path: '/gis', icon: <IconGisMap /> },
    { name: 'Documents', path: '/documents', icon: <IconDocuments /> },
    { name: 'Duplicate Detection', path: '/duplicates', icon: <IconDuplicateDetection /> },
    { name: 'Workflow', path: '/workflow', icon: <IconWorkflow /> },
    { name: 'Analytics', path: '/analytics', icon: <IconAnalytics /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Land Asset Governance</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
