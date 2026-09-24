import { useState, useEffect } from 'react';
import { 
  IconLayers, IconClock, IconAlertTriangle, IconCheckCircle,
  IconSearch, IconFilter, IconChevronDown, IconRotateCcw,
  IconList, IconGrid, IconDownload, IconCalendar, IconChevronUp
} from '../icons/Icons';
import './Dashboard.css';
import './LandAssets.css';
import { useNavigate } from 'react-router-dom';
import { getApplications } from '../../services/applicationService';
import type { LandApplication, ApplicationStatus } from '../../services/applicationService';

const VerificationQueue = () => {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [applications, setApplications] = useState<LandApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getApplications();
      if (response && response.data) {
        setApplications(response.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setError("Unable to load verification queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const totalApplications = applications.length;
  const submitted = applications.filter(a => a.status === 'SUBMITTED').length;
  const underReview = applications.filter(a => a.status === 'UNDER_REVIEW').length;
  const correctionRequired = applications.filter(a => a.status === 'CORRECTION_REQUIRED').length;

  const formatStatus = (status: ApplicationStatus) => {
    switch(status) {
      case 'DRAFT': return 'Draft';
      case 'SUBMITTED': return 'Submitted';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'CORRECTION_REQUIRED': return 'Correction Required';
      case 'VERIFIED': return 'Verified';
      case 'PENDING_APPROVAL': return 'Pending Approval';
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString();
  };

  const renderLocation = (lat?: number | null, lng?: number | null) => {
    if (lat != null && lng != null) {
      return `${lat}, ${lng}`;
    }
    return "Not available";
  };

  return (
    <div className="dashboard-container land-assets-page">
      {/* 1. Page header / breadcrumb & Hero section */}
      <section className="dashboard-hero" style={{ minHeight: '140px', padding: '24px 40px' }}>
        <div className="hero-content">
          <p className="hero-date" style={{ color: 'var(--text-muted)' }}>
            Dashboard &gt; <span style={{ color: 'var(--accent-color)' }}>Verification Queue</span>
          </p>
          <h1 className="hero-welcome">Verification Queue</h1>
          <p className="hero-subtitle">Review and verify submitted land applications.</p>
          <blockquote className="hero-quote">
            "Ensuring Accuracy and Compliance."
          </blockquote>
        </div>
      </section>

      {/* 2. Statistics Grid */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Verification Cases</h3>
            <span className="stat-icon"><IconLayers /></span>
          </div>
          <p className="stat-value">{totalApplications}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Submitted</h3>
            <span className="stat-icon"><IconCheckCircle /></span>
          </div>
          <p className="stat-value">{submitted}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Under Review</h3>
            <span className="stat-icon"><IconClock /></span>
          </div>
          <p className="stat-value">{underReview}</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Correction Required</h3>
            <span className="stat-icon"><IconAlertTriangle /></span>
          </div>
          <p className="stat-value">{correctionRequired}</p>
        </div>
      </section>

      {/* 3. Main Data Section */}
      <section className="dashboard-widget" style={{ padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
        
        {/* Search & Filter section */}
        <div className="search-filter-section">
          <div className="search-filter-header">
            <div className="search-filter-title">
              <IconFilter width={20} height={20} /> Search & Filter Queue
            </div>
            <button className="btn-advanced-filters" onClick={() => setShowAdvanced(!showAdvanced)}>
              Advanced Filters {showAdvanced ? <IconChevronUp width={16} height={16} /> : <IconChevronDown width={16} height={16} />}
            </button>
          </div>

          <div className="search-filter-controls">
            <div className="input-group" style={{ flex: 2 }}>
              <label>Keyword Search</label>
              <div className="input-with-icon">
                <IconSearch width={16} height={16} />
                <input type="text" placeholder="App ID, Survey No., Owner..." />
              </div>
            </div>
            <div className="input-group">
              <label>Asset Type</label>
              <select>
                <option value="">All Types</option>
                <option value="agricultural">Agricultural</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div className="input-group">
              <label>Status</label>
              <select>
                <option value="">All Status</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CORRECTION_REQUIRED">Correction Required</option>
                <option value="VERIFIED">Verified</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date Range</label>
              <div className="input-with-icon">
                <IconCalendar width={16} height={16} />
                <input type="text" placeholder="Select date range" style={{ paddingLeft: '36px' }} onFocus={(e) => e.target.type = 'date'} onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} />
              </div>
            </div>
            
            <div className="filter-actions">
              <button className="btn-secondary">
                <IconRotateCcw width={16} height={16} /> Reset
              </button>
              <button className="btn-primary">
                <IconSearch width={16} height={16} /> Search
              </button>
            </div>
          </div>

          {showAdvanced && (
            <div className="advanced-filters-area">
              <div className="search-filter-controls">
                <div className="input-group">
                  <label>Area Range (Acres)</label>
                  <select><option value="">Any Size</option></select>
                </div>
                <div className="input-group">
                  <label>Applicant Name</label>
                  <input type="text" placeholder="Applicant Name" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Applications Toolbar */}
        <div className="assets-toolbar">
          <div className="toolbar-left">
            <IconLayers width={24} height={24} />
            <h3>Pending Applications</h3>
          </div>
          <div className="toolbar-right">
            <span className="toolbar-count">Showing {applications.length > 0 ? 1 : 0}–{applications.length} of {applications.length} cases</span>
            <div className="toolbar-view-toggle">
              <span className="view-label">View:</span>
              <button className="btn-view active"><IconList width={16} height={16} /></button>
              <button className="btn-view"><IconGrid width={16} height={16} /></button>
            </div>
            <button className="btn-export">
              <IconDownload width={16} height={16} /> Export <IconChevronDown width={14} height={14} />
            </button>
          </div>
        </div>

        {/* Application table */}
        <div className="dashboard-widget" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="assets-table" style={{ width: '100%', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Survey No.</th>
                  <th>Owner / Entity</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Area (Acres)</th>
                  <th>Status</th>
                  <th>Updated Date</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              {!isLoading && !error && applications.length > 0 && (
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.application_id}>
                      <td>{app.application_id}</td>
                      <td>{app.survey_no || 'N/A'}</td>
                      <td>{app.owner_name || 'N/A'}</td>
                      <td>{renderLocation(app.latitude, app.longitude)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{app.asset_type || 'N/A'}</td>
                      <td>{app.area != null ? app.area : 'N/A'}</td>
                      <td>{formatStatus(app.status)}</td>
                      <td>{formatDate(app.updated_at || app.created_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => navigate(`/applications/${app.application_id}`)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            
            {isLoading && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading verification queue...
              </div>
            )}

            {!isLoading && error && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '16px' }}>{error}</p>
                <button className="btn-secondary" onClick={fetchApplications} style={{ cursor: 'pointer' }}>
                  <IconRotateCcw width={16} height={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Retry
                </button>
              </div>
            )}

            {!isLoading && !error && applications.length === 0 && (
              <div className="empty-state" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: '60px 20px',
                border: 'none',
                backgroundColor: '#fff',
                margin: 0
              }}>
                <div style={{ 
                  backgroundColor: 'var(--bg-app)',
                  padding: '16px',
                  borderRadius: '50%',
                  marginBottom: '20px'
                }}>
                  <IconLayers width={32} height={32} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Queue is empty.</p>
                <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>There are no applications requiring verification at this time.</p>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default VerificationQueue;
