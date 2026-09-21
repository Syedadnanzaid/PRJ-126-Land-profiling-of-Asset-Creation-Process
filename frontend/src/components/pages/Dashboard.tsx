import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { getDashboardAnalytics } from '../../services/analyticsService';
import type { DashboardAnalytics } from '../../services/analyticsService';
import { 
  IconLayers, IconClock, IconAlertTriangle, IconCheckCircle, 
  IconFile, IconFileCheck, IconSend, IconXCircle, 
  IconMapPin, IconCloudSun, IconEye
} from '../icons/Icons';
import './Dashboard.css';

const ASSET_COLORS: Record<string, string> = {
  'unknown': '#94A3B8',
  'private land': '#0F9D58',
  'agricultural': '#F4B400',
  'government land': '#6C4CE8',
  'residential': '#3B82F6',
  'commercial': '#F59E0B',
  'others': '#64748B',
};

const getAssetColor = (type: string) => {
  const normalizedType = (type || 'Unknown').toLowerCase();
  return ASSET_COLORS[normalizedType] || ASSET_COLORS['others'];
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  if (isNaN(date.getTime())) return 'unknown time';
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

const getEventTitle = (eventType: string) => {
  switch (eventType) {
    case 'ASSET_CREATED': return 'New land asset created';
    case 'ASSET_UPDATED': return 'Land asset updated';
    case 'DOCUMENT_UPLOADED': return 'Document uploaded';
    case 'SUBMITTED': return 'Asset submitted';
    case 'UNDER_REVIEW': return 'Asset moved to review';
    case 'APPROVED': return 'Asset approved';
    case 'REJECTED': return 'Asset rejected';
    case 'DUPLICATE_FLAGGED': return 'Potential duplicate detected';
    default: return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'ASSET_CREATED': return <IconFileCheck width={16} height={16} />;
    case 'ASSET_UPDATED': return <IconFile width={16} height={16} />;
    case 'DOCUMENT_UPLOADED': return <IconFile width={16} height={16} />;
    case 'SUBMITTED': return <IconSend width={16} height={16} />;
    case 'UNDER_REVIEW': return <IconClock width={16} height={16} />;
    case 'APPROVED': return <IconCheckCircle width={16} height={16} />;
    case 'REJECTED': return <IconXCircle width={16} height={16} />;
    case 'DUPLICATE_FLAGGED': return <IconAlertTriangle width={16} height={16} />;
    default: return <IconCheckCircle width={16} height={16} />;
  }
};

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
          <div 
            className="chart-placeholder-container"
            style={{
              background: `radial-gradient(circle, var(--bg-card, #ffffff) 55%, transparent 56%), ${
                (() => {
                  const total = analyticsData?.distribution?.reduce((sum, item) => sum + item.count, 0) || 0;
                  if (total === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
                  let currentPercentage = 0;
                  const parts = analyticsData!.distribution.map(item => {
                    const color = getAssetColor(item.assetType);
                    const percentage = (item.count / total) * 100;
                    const start = currentPercentage;
                    const end = currentPercentage + percentage;
                    currentPercentage = end;
                    return `${color} ${start}% ${end}%`;
                  });
                  return `conic-gradient(${parts.join(', ')})`;
                })()
              }`
            }}
          >
            {loading ? (
              <p style={{ background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500, boxShadow: 'var(--shadow-sm)' }}>Loading...</p>
            ) : analyticsData?.distribution && analyticsData.distribution.length > 0 ? (
              <div style={{ textAlign: 'center', background: 'var(--bg-card)', borderRadius: '50%', width: '100px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '4px' }}>Total</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)', lineHeight: 1 }}>
                  {analyticsData.distribution.reduce((sum, item) => sum + item.count, 0)}
                </div>
              </div>
            ) : (
              <p style={{ background: 'var(--bg-card)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500, boxShadow: 'var(--shadow-sm)' }}>No Data</p>
            )}
          </div>
          <ul className="distribution-legend">
            {loading ? (
              <li>Loading distribution...</li>
            ) : analyticsData?.distribution && analyticsData.distribution.length > 0 ? (
              (() => {
                const total = analyticsData.distribution.reduce((sum, item) => sum + item.count, 0);
                return analyticsData.distribution.map((d, index) => {
                  const color = getAssetColor(d.assetType);
                  const percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
                  return (
                    <li key={index}>
                      <div className="legend-name">
                        <span className="color-indicator" style={{ backgroundColor: color }}></span> 
                        <span style={{ textTransform: 'capitalize' }}>{d.assetType || 'Unknown'}</span>
                      </div>
                      <div className="legend-stats">
                        <span className="legend-count">{d.count}</span>
                        <span className="legend-percentage">{percentage}%</span>
                      </div>
                    </li>
                  );
                });
              })()
            ) : (
              <>
                <li>
                  <div className="legend-name">
                    <span className="color-indicator" style={{ backgroundColor: ASSET_COLORS['agricultural'] }}></span> Agricultural
                  </div>
                  <div className="legend-stats"><span className="legend-count">0</span><span className="legend-percentage">0%</span></div>
                </li>
                <li>
                  <div className="legend-name">
                    <span className="color-indicator" style={{ backgroundColor: ASSET_COLORS['residential'] }}></span> Residential
                  </div>
                  <div className="legend-stats"><span className="legend-count">0</span><span className="legend-percentage">0%</span></div>
                </li>
                <li>
                  <div className="legend-name">
                    <span className="color-indicator" style={{ backgroundColor: ASSET_COLORS['commercial'] }}></span> Commercial
                  </div>
                  <div className="legend-stats"><span className="legend-count">0</span><span className="legend-percentage">0%</span></div>
                </li>
                <li>
                  <div className="legend-name">
                    <span className="color-indicator" style={{ backgroundColor: ASSET_COLORS['government land'] }}></span> Government
                  </div>
                  <div className="legend-stats"><span className="legend-count">0</span><span className="legend-percentage">0%</span></div>
                </li>
                <li>
                  <div className="legend-name">
                    <span className="color-indicator" style={{ backgroundColor: ASSET_COLORS['others'] }}></span> Others
                  </div>
                  <div className="legend-stats"><span className="legend-count">0</span><span className="legend-percentage">0%</span></div>
                </li>
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
        <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Recent Asset Registrations</h2>
          <button 
            className="view-all-link" 
            onClick={() => navigate('/assets')}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View All &rarr;
          </button>
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
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>Loading recent assets...</td>
                </tr>
              ) : analyticsData?.recentAssets && analyticsData.recentAssets.length > 0 ? (
                analyticsData.recentAssets.map(asset => {
                  const locationStr = (asset.latitude != null && asset.longitude != null) 
                    ? `${asset.latitude.toFixed(4)}, ${asset.longitude.toFixed(4)}` 
                    : 'N/A';
                  const typeColor = getAssetColor(asset.asset_type || '');
                  return (
                    <tr key={asset.asset_id}>
                      <td style={{ fontWeight: 500 }}>{asset.asset_id.substring(0, 8).toUpperCase()}</td>
                      <td>{locationStr}</td>
                      <td style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center' }}>
                        <span className="asset-type-indicator" style={{ backgroundColor: typeColor }}></span>
                        {asset.asset_type || 'N/A'}
                      </td>
                      <td>{asset.area != null ? asset.area.toString() : 'N/A'}</td>
                      <td>{new Date(asset.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td>
                        <span className={`status-badge ${asset.status.toLowerCase()}`}>
                          {asset.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="action-btn view-btn" 
                          onClick={() => navigate(`/assets/${asset.asset_id}`)}
                          style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                        >
                          <IconEye width={14} height={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
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
          <div className="header-actions">
            <span className="view-all-text" style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>View All &rarr;</span>
          </div>
        </div>
        <div className="timeline-container">
          {loading ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <p>Loading activities...</p>
            </div>
          ) : analyticsData?.recentActivities && analyticsData.recentActivities.length > 0 ? (
            <div className="timeline">
              {analyticsData.recentActivities.map((activity) => (
                <div key={activity.event_id} className="timeline-item">
                  <div className="timeline-icon">
                    {getEventIcon(activity.event_type)}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <p className="timeline-title">{getEventTitle(activity.event_type)}</p>
                      <span className="timeline-time">{formatRelativeTime(activity.created_at)}</span>
                    </div>
                    <p className="timeline-asset">Asset: {activity.asset_id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              ))}
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
