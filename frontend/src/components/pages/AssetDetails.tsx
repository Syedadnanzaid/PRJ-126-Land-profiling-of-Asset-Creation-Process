import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAssetById } from '../../services/assetService';
import type { LandAsset } from '../../services/assetService';
import { 
  IconGisMap, IconFile, IconCheckCircle, IconMapPin, IconLayers, 
  IconFileCheck, IconXCircle, IconGrid, IconUsers, IconClock, 
  IconDuplicateDetection, IconWorkflow, IconDownload
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
    const fetchAsset = async () => {
      if (!assetId) return;
      try {
        setLoading(true);
        const response = await getAssetById(assetId);
        if (response && response.data) {
          setAsset(response.data);
        } else {
          setError('Failed to load asset details. Asset may not exist.');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching the asset.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAsset();
  }, [assetId]);

  if (loading) {
    return (
      <div className="ad-loading-state">
        <div className="spinner"></div>
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="ad-error-state">
        <IconXCircle width={48} height={48} />
        <h2>Asset Not Found</h2>
        <p>{error || 'The requested land asset could not be found.'}</p>
        <button className="ad-btn-primary" onClick={() => navigate('/assets')}>
          Return to Assets
        </button>
      </div>
    );
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatEventName = (eventType: string) => {
    const eventMap: Record<string, string> = {
      'ASSET_CREATED': 'New land asset created',
      'ASSET_UPDATED': 'Asset information updated',
      'DOCUMENT_UPLOADED': 'Document uploaded',
      'SUBMITTED': 'Asset submitted for review',
      'UNDER_REVIEW': 'Asset moved to review',
      'APPROVED': 'Asset approved',
      'REJECTED': 'Asset rejected',
      'DUPLICATE_FLAGGED': 'Duplicate detected'
    };
    return eventMap[eventType] || formatStatus(eventType);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 60000) return 'Just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <IconGrid width={18} height={18} /> },
    { id: 'location', label: 'Location & Map', icon: <IconMapPin width={18} height={18} /> },
    { id: 'documents', label: 'Documents', icon: <IconFile width={18} height={18} /> },
    { id: 'ownership', label: 'Ownership', icon: <IconUsers width={18} height={18} /> },
    { id: 'history', label: 'History', icon: <IconClock width={18} height={18} /> },
    { id: 'related', label: 'Related Assets', icon: <IconDuplicateDetection width={18} height={18} /> },
  ];

  const workflowStages = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
  const currentStageIndex = workflowStages.indexOf(asset.status) !== -1 ? workflowStages.indexOf(asset.status) : 0;

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
              <Link to="/assets">Land Assets</Link>
              <span className="separator">&gt;</span>
              <span className="current">{asset.asset_id}</span>
            </div>
            <div className="ad-hero-actions">
              <button className="ad-btn-secondary">
                <IconFileCheck width={18} height={18} /> Edit Asset
              </button>
              <button className="ad-btn-primary">
                <IconGisMap width={18} height={18} /> View on Map
              </button>
            </div>
          </div>
          
          <div className="ad-hero-bottom">
            <div className="ad-hero-text">
              <h1>Asset Details</h1>
              <p>View complete information about this land asset.</p>
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
            <span className="summary-label">Status</span>
            <span className={`ad-status-badge ${asset.status.toLowerCase()}`}>
              {formatStatus(asset.status)}
            </span>
          </div>
          <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Last Updated</span>
              <span className="summary-value">{new Date(asset.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
              <span className="summary-label">Asset Type</span>
              <span className="summary-value" style={{ textTransform: 'capitalize' }}>{asset.asset_type || 'Unknown'}</span>
            </div>
            <div className="summary-separator"></div>
            
            <div className="summary-item">
              <span className="summary-label">Owner</span>
              <span className="summary-value">{asset.owner_name || 'N/A'}</span>
            </div>
        </div>
      </div>

      {/* 4. Tabs */}
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

      {/* 5. Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="ad-overview-grid">
          {/* LEFT COLUMN */}
          <div className="ad-overview-col">
            
            {/* Basic Information */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#DBEAFE', color: '#3B82F6' }}>
                  <IconFile width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Basic Information</h3>
                  <p>Key details of the land asset.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-list two-column">
                  <div className="ad-info-row">
                    <span className="label">Asset ID</span>
                    <span className="value">{asset.asset_id.substring(0, 8).toUpperCase()}</span>
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
                    <span className="label">Location</span>
                    <span className="value">
                      {asset.latitude != null && asset.longitude != null 
                        ? `${asset.latitude.toFixed(4)}, ${asset.longitude.toFixed(4)}` 
                        : 'Not available'}
                    </span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Status</span>
                    <span className={`ad-status-badge ${asset.status.toLowerCase()}`}>{formatStatus(asset.status)}</span>
                  </div>
                </div>
                <div className="ad-info-row full-width" style={{ marginTop: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="label">Description</span>
                  <p className="description-value">{asset.description || 'Not available'}</p>
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
                  <p>Details of the owner or owning entity.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-list">
                  <div className="ad-info-row">
                    <span className="label">Owner Name</span>
                    <span className="value">{asset.owner_name || 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Contact Details</span>
                    <span className="value text-muted">Not available</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Ownership Type</span>
                    <span className="value text-muted">Not available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <IconClock width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Recent Activities</h3>
                  <p>Latest actions performed on this asset.</p>
                </div>
                <button className="ad-btn-text">View All</button>
              </div>
              <div className="ad-card-body">
                {asset.events && asset.events.length > 0 ? (
                  <div className="ad-timeline">
                    {asset.events.map((event, index) => (
                      <div key={event.event_id || index} className="ad-timeline-item">
                        <div className="ad-timeline-marker"></div>
                        <div className="ad-timeline-content">
                          <p className="ad-timeline-title">{formatEventName(event.event_type)}</p>
                          <p className="ad-timeline-desc">{event.description}</p>
                          <small className="ad-timeline-time">{formatTimeAgo(event.created_at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ad-empty-state">
                    <p>No recent activities found.</p>
                  </div>
                )}
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
                  <p>Geographic location and boundary of the land asset.</p>
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

            {/* Documents */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                  <IconFile width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Documents</h3>
                  <p>Related documents and files.</p>
                </div>
                <button className="ad-btn-primary small">Upload Document</button>
              </div>
              <div className="ad-card-body">
                {asset.documents && asset.documents.length > 0 ? (
                  <div className="ad-document-list">
                    {asset.documents.map((doc, index) => (
                      <div key={doc.document_id || index} className="ad-document-item">
                        <IconFile width={20} height={20} color="#64748B" />
                        <div className="doc-info">
                          <span className="doc-name">{doc.file_name}</span>
                          <span className="doc-meta">{doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        <button className="ad-btn-icon"><IconDownload width={16} height={16} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ad-empty-state">
                    <IconFile width={32} height={32} color="#94A3B8" />
                    <p>No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Status (Horizontal) */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#FFEDD5', color: '#EA580C' }}>
                  <IconWorkflow width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Workflow Status</h3>
                  <p>Current stage of the asset in the system.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-workflow-horizontal">
                  {workflowStages.map((stage, index) => {
                    const isCompleted = index <= currentStageIndex;
                    const isActive = index === currentStageIndex;
                    const isRejected = asset.status === 'REJECTED';
                    
                    return (
                      <div key={stage} className={`ad-hz-step ${isCompleted && !isRejected ? 'completed' : ''} ${isActive && !isRejected ? 'active' : ''}`}>
                        <div className="ad-hz-marker">
                          {isCompleted && !isRejected ? <IconCheckCircle width={16} height={16} /> : <div className="ad-dot" />}
                        </div>
                        <p className="ad-hz-title">{formatStatus(stage)}</p>
                        {index < workflowStages.length - 1 && <div className="ad-hz-line"></div>}
                      </div>
                    );
                  })}
                </div>
                {asset.status === 'REJECTED' && (
                  <div className="ad-workflow-rejected">
                    <IconXCircle width={20} height={20} color="#EF4444" />
                    <span>This asset was rejected in the workflow.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== 'overview' && (
        <div className="ad-empty-state large">
          <IconLayers width={48} height={48} color="#CBD5E1" />
          <h3>{tabs.find(t => t.id === activeTab)?.label}</h3>
          <p>This module is currently under construction.</p>
        </div>
      )}
    </div>
  );
};

export default AssetDetails;
