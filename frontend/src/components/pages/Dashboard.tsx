import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { getDashboardAnalytics } from '../../services/analyticsService';
import type { DashboardAnalytics } from '../../services/analyticsService';
import { 
  IconLayers, IconClock, IconAlertTriangle, IconCheckCircle, 
  IconFile, IconFileCheck, IconSend, IconXCircle, 
  IconMapPin, IconCloudSun 
} from '../icons/Icons';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardAnalytics();
        if (mounted) {
          setAnalyticsData(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load dashboard analytics');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Utility to format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="dashboard-container">
      {/* 1. Dashboard Hero/Header Area */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <p className="hero-date">{currentDate}</p>
          <h1 className="hero-welcome">Welcome back, Admin!</h1>
          <p className="hero-subtitle">Here's what's happening with your land assets today.</p>
          <blockquote className="hero-quote">
            "Sustainable Land. Smarter Governance."
          </blockquote>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
          <div className="weather-card-placeholder">
            <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <IconMapPin width={16} height={16} /> 
              <IconCloudSun width={20} height={20} /> 
              Weather Info (Placeholder)
            </p>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '10px 16px', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              color: '#fff', 
              border: '1px solid rgba(255, 255, 255, 0.3)', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              backdropFilter: 'blur(12px)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          >
            Logout
          </button>
        </div>
      </section>

      {error && (
        <div style={{ padding: '16px 24px', backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.3)', borderRadius: '8px', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* 2. Four Statistics Cards */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Land Assets</h3>
            <span className="stat-icon"><IconLayers /></span>
          </div>
          <p className="stat-value">{loading ? '...' : (analyticsData?.statistics.totalAssets ?? 0)}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3 style={{ whiteSpace: 'nowrap' }}>Pending Workflows</h3>
            <span className="stat-icon"><IconClock /></span>
          </div>
          <p className="stat-value">{loading ? '...' : (analyticsData?.statistics.pendingWorkflows ?? 0)}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Duplicate Flags</h3>
            <span className="stat-icon"><IconAlertTriangle /></span>
          </div>
          <p className="stat-value">{loading ? '...' : (analyticsData?.statistics.duplicateFlags ?? 0)}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Approved Assets</h3>
            <span className="stat-icon"><IconCheckCircle /></span>
          </div>
          <p className="stat-value">{loading ? '...' : (analyticsData?.statistics.approvedAssets ?? 0)}</p>
        </div>
      </section>

      {/* 3. Main Content Row */}
      <section className="dashboard-main-row">
        {/* A. Asset Distribution by Type */}
        <div className="dashboard-widget asset-distribution">
          <div className="widget-header">
            <h2>Asset Distribution by Type</h2>
            <div className="widget-filter-placeholder">
              <button>This Month</button>
            </div>
          </div>
          <div className="chart-placeholder-container">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <p>Chart Placeholder</p>
            )}
          </div>
          <ul className="distribution-legend">
            {loading ? (
              <li>Loading distribution...</li>
            ) : analyticsData?.distribution && analyticsData.distribution.length > 0 ? (
              analyticsData.distribution.map((d, index) => {
                const typeClass = d.assetType ? d.assetType.toLowerCase() : 'others';
                return (
                  <li key={index}>
                    <span className={`color-indicator ${typeClass}`}></span> 
                    <span style={{ textTransform: 'capitalize' }}>{d.assetType || 'Others'}</span> ({d.count})
                  </li>
                );
              })
            ) : (
              <>
                <li><span className="color-indicator agricultural"></span> Agricultural</li>
                <li><span className="color-indicator residential"></span> Residential</li>
                <li><span className="color-indicator commercial"></span> Commercial</li>
                <li><span className="color-indicator government"></span> Government</li>
                <li><span className="color-indicator others"></span> Others</li>
              </>
            )}
          </ul>
        </div>

        {/* B. Geographic Overview */}
        <div className="dashboard-widget geographic-overview">
          <div className="widget-header">
            <h2>Geographic Overview</h2>
            <div className="map-toggles-placeholder">
              <button className="active">Map</button>
              <button>Satellite</button>
            </div>
          </div>
          <div className="map-placeholder-container">
            {loading ? (
              <p>Loading map...</p>
            ) : analyticsData?.geographicAssets && analyticsData.geographicAssets.length > 0 ? (
              <p>Map Placeholder ({analyticsData.geographicAssets.length} locations)</p>
            ) : (
              <p>Map Placeholder</p>
            )}
          </div>
          <div className="map-legend">
            <span className="legend-item"><span className="dot approved"></span> Approved</span>
            <span className="legend-item"><span className="dot pending"></span> Pending Review</span>
            <span className="legend-item"><span className="dot flagged"></span> Flagged / Duplicate</span>
            <span className="legend-item"><span className="dot processing"></span> Under Process</span>
          </div>
        </div>

        {/* C. Workflow Status */}
        <div className="dashboard-widget workflow-status">
          <div className="widget-header">
            <h2>Workflow Status</h2>
            <a href="#" className="view-all-placeholder">View All</a>
          </div>
          <ul className="workflow-status-list">
            <li>
              <span className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconFile width={16} height={16} /> New Submissions
              </span>
              <span className="status-count">{loading ? '...' : (analyticsData?.workflowStatus.newSubmissions ?? 0)}</span>
            </li>
            <li>
              <span className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconFileCheck width={16} height={16} /> Under Verification
              </span>
              <span className="status-count">{loading ? '...' : (analyticsData?.workflowStatus.underVerification ?? 0)}</span>
            </li>
            <li>
              <span className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconSend width={16} height={16} /> Sent for Approval
              </span>
              <span className="status-count">{loading ? '...' : (analyticsData?.workflowStatus.sentForApproval ?? 0)}</span>
            </li>
            <li>
              <span className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheckCircle width={16} height={16} /> Approved
              </span>
              <span className="status-count">{loading ? '...' : (analyticsData?.workflowStatus.approved ?? 0)}</span>
            </li>
            <li>
              <span className="status-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconXCircle width={16} height={16} /> Rejected
              </span>
              <span className="status-count">{loading ? '...' : (analyticsData?.workflowStatus.rejected ?? 0)}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Recent Asset Registrations */}
      <section className="dashboard-widget recent-assets">
        <div className="widget-header">
          <h2>Recent Asset Registrations</h2>
        </div>
        <div className="table-responsive">
          <table className="assets-table">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Location</th>
                <th>Type</th>
                <th>Area (Acres)</th>
                <th>Date Added</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Loading recent assets...</td>
                </tr>
              ) : analyticsData?.recentAssets && analyticsData.recentAssets.length > 0 ? (
                analyticsData.recentAssets.map(asset => (
                  <tr key={asset.asset_id}>
                    <td>{asset.asset_id.substring(0, 8)}...</td>
                    <td>{asset.survey_no || 'N/A'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{asset.asset_type || 'N/A'}</td>
                    <td>N/A</td>
                    <td>{new Date(asset.created_at).toLocaleDateString()}</td>
                    <td>
                      {asset.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem' }}>View</span>
                    </td>
                  </tr>
                ))
              ) : null}
            </tbody>
          </table>
          {(!loading && (!analyticsData?.recentAssets || analyticsData.recentAssets.length === 0)) && (
            <div className="empty-state">
              <p>No land assets registered yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Recent Activities */}
      <section className="dashboard-widget recent-activities">
        <div className="widget-header">
          <h2>Recent Activities</h2>
        </div>
        <div className="timeline-container">
          {loading ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <p>Loading activities...</p>
            </div>
          ) : analyticsData?.recentActivities && analyticsData.recentActivities.length > 0 ? (
            <div className="empty-state">
              <p>Activity timeline...</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>No recent activities found.</p>
            </div>
          )}
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="dashboard-footer">
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Support</a>
        </div>
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Land Asset Governance.</p>
          <p className="footer-slogan">For a Better Tomorrow</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
