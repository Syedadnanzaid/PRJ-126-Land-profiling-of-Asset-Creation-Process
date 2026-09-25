import { useState, useEffect } from 'react';
import { 
  IconLayers, IconSearch, IconFilter, IconChevronDown, IconRotateCcw,
  IconList, IconGrid, IconDownload, IconCalendar, IconChevronUp
} from '../icons/Icons';
import './Dashboard.css';
import './LandAssets.css';
import { useNavigate } from 'react-router-dom';
import { getAssets } from '../../services/assetService';
import type { LandAsset } from '../../services/assetService';

const AssetRegistry = () => {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [assets, setAssets] = useState<LandAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<LandAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination State
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAssets();
      if (response && response.data) {
        setAssets(response.data);
        setFilteredAssets(response.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setError("Unable to load land assets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    let result = assets;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.asset_id.toLowerCase().includes(q) ||
        (a.survey_no && a.survey_no.toLowerCase().includes(q)) ||
        (a.owner_name && a.owner_name.toLowerCase().includes(q)) ||
        (a.land_id && a.land_id.toLowerCase().includes(q))
      );
    }

    if (assetTypeFilter) {
      result = result.filter(a => a.asset_type?.toLowerCase() === assetTypeFilter.toLowerCase());
    }

    if (dateFilter) {
      result = result.filter(a => new Date(a.created_at).toISOString().startsWith(dateFilter));
    }

    setFilteredAssets(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchQuery, assetTypeFilter, dateFilter, assets]);

  const handleExport = () => {
    if (filteredAssets.length === 0) return;
    
    const headers = ['Asset ID', 'Survey No.', 'Owner / Entity', 'Latitude', 'Longitude', 'Type', 'Area (Acres)', 'Registered Date'];
    const csvRows = [headers.join(',')];

    for (const asset of filteredAssets) {
      const row = [
        asset.asset_id,
        asset.survey_no || 'N/A',
        `"${(asset.owner_name || 'N/A').replace(/"/g, '""')}"`,
        asset.latitude || '',
        asset.longitude || '',
        asset.asset_type || 'N/A',
        asset.area || '',
        new Date(asset.created_at).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'official-land-assets.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAssetTypeFilter('');
    setDateFilter('');
  };

  // Pagination logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAssets.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAssets.length / entriesPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const totalAssets = filteredAssets.length;

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
            Dashboard &gt; <span style={{ color: 'var(--accent-color)' }}>Official Asset Registry</span>
          </p>
          <h1 className="hero-welcome">Land Asset Registry</h1>
          <p className="hero-subtitle">View and search the official register of approved land assets.</p>
          <blockquote className="hero-quote">
            "Ensuring Sustainability and Clear Governance."
          </blockquote>
        </div>
        <div className="hero-actions">
          {/* No Create Button in Official Registry */}
        </div>
      </section>

      {/* 2. Statistics Grid */}
      <section className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Official Assets</h3>
            <span className="stat-icon"><IconLayers /></span>
          </div>
          <p className="stat-value">{totalAssets}</p>
        </div>
      </section>

      {/* 3. Main Data Section */}
      <section className="dashboard-widget" style={{ padding: 0, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
        
        {/* Search & Filter section */}
        <div className="search-filter-section">
          <div className="search-filter-header">
            <div className="search-filter-title">
              <IconFilter width={20} height={20} /> Search & Filter Registry
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
                <input 
                  type="text" 
                  placeholder="Asset ID, Survey No., Owner..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="input-group">
              <label>Asset Type</label>
              <select value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="agricultural">Agricultural</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date Range (Start)</label>
              <div className="input-with-icon">
                <IconCalendar width={16} height={16} />
                <input 
                  type="date" 
                  style={{ paddingLeft: '36px' }}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <button className="btn-secondary" onClick={handleResetFilters}>
                <IconRotateCcw width={16} height={16} /> Reset
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
              </div>
            </div>
          )}
        </div>

        {/* All Assets Toolbar */}
        <div className="assets-toolbar">
          <div className="toolbar-left">
            <IconLayers width={24} height={24} />
            <h3>Official Assets</h3>
          </div>
          <div className="toolbar-right">
            <span className="toolbar-count">Showing {currentEntries.length > 0 ? indexOfFirstEntry + 1 : 0}–{indexOfFirstEntry + currentEntries.length} of {filteredAssets.length} assets</span>
            <div className="toolbar-view-toggle">
              <span className="view-label">View:</span>
              <button className="btn-view active"><IconList width={16} height={16} /></button>
            </div>
            <button className="btn-export" onClick={handleExport} disabled={filteredAssets.length === 0}>
              <IconDownload width={16} height={16} /> Export
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
                  <th>Registered Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              {!isLoading && !error && currentEntries.length > 0 && (
                <tbody>
                  {currentEntries.map((asset) => (
                    <tr key={asset.asset_id}>
                      <td>{asset.asset_id}</td>
                      <td>{asset.survey_no || 'N/A'}</td>
                      <td>{asset.owner_name || 'N/A'}</td>
                      <td>{renderLocation(asset.latitude, asset.longitude)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{asset.asset_type || 'N/A'}</td>
                      <td>{asset.area != null ? asset.area : 'N/A'}</td>
                      <td>{formatDate(asset.created_at)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          onClick={() => navigate(`/assets/${asset.asset_id}`)}
                          style={{ color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          View Details
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            
            {isLoading && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading official land assets...
              </div>
            )}

            {!isLoading && error && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '16px' }}>{error}</p>
                <button className="btn-secondary" onClick={fetchAssets} style={{ cursor: 'pointer' }}>
                  <IconRotateCcw width={16} height={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Retry
                </button>
              </div>
            )}

            {!isLoading && !error && filteredAssets.length === 0 && (
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
                <p style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No official land assets available.</p>
                <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Once land applications are fully approved, they will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="pagination-left">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Showing {currentEntries.length > 0 ? indexOfFirstEntry + 1 : 0}–{indexOfFirstEntry + currentEntries.length} of {filteredAssets.length} assets
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Show</span>
              <select className="entries-select" value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>entries</span>
            </div>
          </div>
          <div className="pagination-right">
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                disabled={currentPage === 1 || totalPages === 0}
                onClick={() => paginate(currentPage - 1)}
              >
                Previous
              </button>
              <button className="btn-page active">{totalPages > 0 ? currentPage : 0}</button>
              <button 
                className="btn-page" 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => paginate(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AssetRegistry;
