import './Sidebar.css';
import { 
  IconDashboard, IconLandAssets, IconGisMap, 
  IconDocuments, IconDuplicateDetection, IconWorkflow, IconAnalytics 
} from '../icons/Icons';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const Sidebar = ({ activePage, setActivePage }: SidebarProps) => {
  const navItems = [
    { name: 'Dashboard', icon: <IconDashboard /> },
    { name: 'Land Assets', icon: <IconLandAssets /> },
    { name: 'GIS Map', icon: <IconGisMap /> },
    { name: 'Documents', icon: <IconDocuments /> },
    { name: 'Duplicate Detection', icon: <IconDuplicateDetection /> },
    { name: 'Workflow', icon: <IconWorkflow /> },
    { name: 'Analytics', icon: <IconAnalytics /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Land Asset Governance</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item, index) => (
            <li key={index} className={item.name === activePage ? 'active' : ''}>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage(item.name);
                }}
              >
                <span className="icon">{item.icon}</span>
                <span className="text">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
