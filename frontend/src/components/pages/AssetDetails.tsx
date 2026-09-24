import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAssetById } from '../../services/assetService';
import type { LandAsset } from '../../services/assetService';
import { 
  IconGisMap, IconMapPin, IconLayers, 
  IconXCircle, IconGrid, IconUsers
} from '../icons/Icons';
import loginLandscape from '../../assets/login-landscape.png';
import './AssetDetails.css';

const AssetDetails = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  
  const [asset, setAsset] = useState<LandAsset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!assetId) return;
      try {
        setLoading(true);
        const assetRes = await getAssetById(assetId);
        
        if (assetRes && assetRes.data) {
          setAsset(assetRes.data);
        } else {
          setError('Failed to load asset details. Asset may not exist.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [assetId]);

  if (loading) {
    return (
      <div className="ad-loading-state">
        <div className="spinner"></div>
        <p>Loading official asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="ad-error-state">
        <IconXCircle width={48} height={48} />
        <h2>Asset Not Found</h2>
        <p>{error || 'The requested official land asset could not be found.'}</p>
        <button className="ad-btn-primary" onClick={() => navigate('/assets')}>
          Return to Registry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <IconGrid width={18} height={18} /> },
    { id: 'location', label: 'Location & Map', icon: <IconMapPin width={18} height={18} /> },
  ];

  return (
    <div className="asset-details-container">
      {/* HERO SECTION */}
      <div 
        className="ad-hero" 
        style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.45)), url(${loginLandscape})` }}
      >
        <div className="ad-hero-inner">
          <div className="ad-hero-top">
            <div className="ad-breadcrumb">
              <Link to="/assets">Asset Registry</Link>
              <span className="separator">&gt;</span>
              <span className="current">{asset.asset_id}</span>
            </div>
            <div className="ad-hero-actions">
              <button className="ad-btn-primary">
                <IconGisMap width={18} height={18} /> View on Map
              </button>
            </div>
          </div>
          
          <div className="ad-hero-bottom">
            <div className="ad-hero-text">
              <h1>Official Land Asset Details</h1>
              <p>View complete, finalized information about this registered land asset.</p>
            </div>
            <div className="ad-hero-quote">
              <p>"Transparent land data<br/>for stronger communities."</p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="ad-summary-wrapper">
        <div className="ad-summary-card">
          
          <div className="summary-item-group asset-id-group">
            <div className="summary-icon-wrapper">
              <IconLayers width={28} height={28} color="#0F9D58" />
            </div>
            <div className="summary-item">
              <span className="summary-label">Asset ID</span>
              <span className="summary-value highlight">{asset.asset_id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="summary-separator"></div>
          
          <div className="summary-item">
            <span className="summary-label">Registry Status</span>
            <span className="ad-status-badge approved">
              Registered
            </span>
          </div>
          <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Registered Date</span>
              <span className="summary-value">{new Date(asset.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Survey Number</span>
              <span className="summary-value">{asset.survey_no || 'N/A'}</span>
            </div>
            <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Area (Acres)</span>
              <span className="summary-value">{asset.area != null ? asset.area.toString() : 'N/A'}</span>
            </div>
            <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Location</span>
              <span className="summary-value">
                {asset.latitude != null && asset.longitude != null 
                  ? `${asset.latitude.toFixed(4)}, ${asset.longitude.toFixed(4)}` 
                  : 'N/A'}
              </span>
            </div>
            <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Owner</span>
              <span className="summary-value">{asset.owner_name || 'N/A'}</span>
            </div>
        </div>
      </div>

      {/* TABS */}
      <div className="ad-tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ad-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="ad-overview-grid">
          {/* LEFT COLUMN */}
          <div className="ad-overview-col">
            
            {/* Basic Information */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
                  <IconLayers width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Asset Information</h3>
                  <p>Key details of the finalized land asset.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-list two-column">
                  <div className="ad-info-row">
                    <span className="label">Asset ID</span>
                    <span className="value">{asset.asset_id}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Survey Number</span>
                    <span className="value">{asset.survey_no || 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Asset Type</span>
                    <span className="value" style={{ textTransform: 'capitalize' }}>{asset.asset_type || 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Area (Acres)</span>
                    <span className="value">{asset.area != null ? asset.area.toString() : 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Registered Date</span>
                    <span className="value">{new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Last Updated</span>
                    <span className="value">{new Date(asset.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="ad-info-row full-width" style={{ marginTop: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="label">Description</span>
                  <p className="description-value" style={{ margin: '8px 0 0 0', color: '#1E293B' }}>{asset.description || 'Not available'}</p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#F3E8FF', color: '#A855F7' }}>
                  <IconUsers width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Owner Information</h3>
                  <p>Details of the registered owner or owning entity.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-list">
                  <div className="ad-info-row">
                    <span className="label">Owner Name</span>
                    <span className="value" style={{ fontWeight: 600, color: '#1E293B' }}>{asset.owner_name || 'Not available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="ad-overview-col">
            
            {/* Asset Location */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#ECFDF5', color: '#0F9D58' }}>
                  <IconMapPin width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Asset Location</h3>
                  <p>Geographic coordinates and boundary of the land asset.</p>
                </div>
                <button className="ad-btn-secondary small">
                  <IconGisMap width={14} height={14} /> Open in GIS
                </button>
              </div>
              <div className="ad-card-body">
                <div className="ad-map-container">
                  <div className="ad-map-placeholder-visual">
                    <div className="map-controls">
                      <div className="map-toggle">
                        <button className="active">Map</button>
                        <button>Satellite</button>
                      </div>
                      <div className="map-zoom">
                        <button>+</button>
                        <button>-</button>
                      </div>
                    </div>
                    <div className="map-boundary-overlay"></div>
                  </div>
                  <div className="ad-map-details">
                    <div className="map-detail-item">
                      <span className="label">Latitude (Center)</span>
                      <span className="value">{asset.latitude != null ? asset.latitude.toFixed(6) : 'Not available'}</span>
                    </div>
                    <div className="map-detail-item">
                      <span className="label">Longitude (Center)</span>
                      <span className="value">{asset.longitude != null ? asset.longitude.toFixed(6) : 'Not available'}</span>
                    </div>
                    <div className="map-detail-item">
                      <span className="label">Area</span>
                      <span className="value">{asset.area != null ? `${asset.area} Acres` : 'Not available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab === 'location' && (
        <div className="ad-empty-state large">
          <IconMapPin width={48} height={48} color="#CBD5E1" />
          <h3>Location Data</h3>
          <p>Detailed GIS mapping view will be displayed here.</p>
        </div>
      )}

    </div>
  );
};

export default AssetDetails;
