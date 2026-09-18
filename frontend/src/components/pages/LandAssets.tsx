import { useState } from 'react';
import { 
  IconLayers, IconClock, IconAlertTriangle, IconCheckCircle,
  IconSearch, IconFilter, IconChevronDown, IconRotateCcw,
  IconList, IconGrid, IconDownload, IconCalendar, IconChevronUp
} from '../icons/Icons';
import './Dashboard.css';
import './LandAssets.css';

const LandAssets = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="dashboard-container land-assets-page">
      {/* 1. Page header / breadcrumb & Hero section */}
      <section className="dashboard-hero" style={{ minHeight: '140px', padding: '24px 40px' }}>
        <div className="hero-content">
          <p className="hero-date" style={{ color: 'var(--text-muted)' }}>
            Dashboard &gt; <span style={{ color: 'var(--accent-color)' }}>Land Assets</span>
          </p>
          <h1 className="hero-welcome">Land Assets</h1>
          <p className="hero-subtitle">View, manage and track all registered land assets.</p>
          <blockquote className="hero-quote">
            "Ensuring Sustainability and Clear Governance."
          </blockquote>
        </div>
        <div className="hero-actions">
          <button className="btn-primary">
            <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>+</span> Add New Asset
          </button>
        </div>
      </section>

      {/* 2. Statistics Grid */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Land Assets</h3>
            <span className="stat-icon"><IconLayers /></span>
          </div>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Pending Review</h3>
            <span className="stat-icon"><IconClock /></span>
          </div>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Duplicate Flags</h3>
            <span className="stat-icon"><IconAlertTriangle /></span>
          </div>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Approved Assets</h3>
            <span className="stat-icon"><IconCheckCircle /></span>
          </div>
          <p className="stat-value">0</p>
        </div>
      </section>

      {/* 3. Main Data Section */}
      <section className="dashboard-widget" style={{ padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
        
        {/* Search & Filter section */}
        <div className="search-filter-section">
          <div className="search-filter-header">
            <div className="search-filter-title">
              <IconFilter width={20} height={20} /> Search & Filter Assets
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
                <input type="text" placeholder="Asset ID, Survey No., Owner..." />
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
              <label>Location</label>
              <select>
                <option value="">All Locations</option>
              </select>
            </div>
            <div className="input-group">
              <label>Status</label>
              <select>
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
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
                  <label>Created By</label>
                  <select><option value="">Any User</option></select>
                </div>
                <div className="input-group">
                  <label>AI Verification</label>
                  <select><option value="">Any Result</option></select>
                </div>
                <div className="input-group">
                  <label>Document Status</label>
                  <select><option value="">Any Status</option></select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Land Assets Toolbar */}
        <div className="assets-toolbar">
          <div className="toolbar-left">
            <IconLayers width={24} height={24} />
            <h3>All Land Assets</h3>
          </div>
          <div className="toolbar-right">
            <span className="toolbar-count">Showing 0–0 of 0 assets</span>
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

        {/* Asset table */}
        <div className="dashboard-widget" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="assets-table" style={{ width: '100%', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Survey No.</th>
                  <th>Owner / Entity</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Area (Acres)</th>
                  <th>Status</th>
                  <th>AI Check</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* No rows, showing empty state instead */}
              </tbody>
            </table>
            
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
              <p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No land assets available yet.</p>
              <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Get started by registering a new land asset into the system.</p>
              <button className="btn-primary">
                <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>+</span> Add First Asset
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="pagination-left">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Showing 0–0 of 0 assets
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Show</span>
              <select className="entries-select" disabled>
                <option value="10">10</option>
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>entries</span>
            </div>
          </div>
          <div className="pagination-right">
            <div className="pagination-controls">
              <button className="btn-page" disabled>Previous</button>
              <button className="btn-page active" disabled>1</button>
              <button className="btn-page" disabled>Next</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandAssets;
