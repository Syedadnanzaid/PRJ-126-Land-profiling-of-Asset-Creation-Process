import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getApplicationById, submitApplication, startVerification, 
  requestCorrection, resubmitApplication, completeVerification, 
  requestApproval, approveApplication, rejectApplication,
  getApplicationDocuments, uploadApplicationDocument, deleteDocument,
  downloadDocument
} from '../../services/applicationService';
import type { LandApplication, Document } from '../../services/applicationService';
import { getCurrentUser } from '../../services/authService';
import type { User } from '../../services/authService';
import { 
  IconFile, IconCheckCircle, IconMapPin, IconLayers, 
  IconXCircle, IconGrid, IconClock, 
  IconDuplicateDetection, IconWorkflow, IconDownload
} from '../icons/Icons';
import loginLandscape from '../../assets/login-landscape.png';
import './AssetDetails.css'; // Reusing visual styling

const ApplicationDetails = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState<LandApplication | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Workflow state
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showRemarksModal, setShowRemarksModal] = useState<boolean>(false);
  const [remarksText, setRemarksText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !applicationId) return;

    setActionLoading(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadApplicationDocument(applicationId, formData);
      setActionMessage({ type: 'success', text: 'Document uploaded successfully.' });
      await refreshApplication();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to upload document.' });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    setActionLoading(true);
    setActionMessage(null);
    
    try {
      await deleteDocument(documentId);
      setActionMessage({ type: 'success', text: 'Document deleted successfully.' });
      await refreshApplication();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete document.' });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocumentAction = async (doc: Document, action: 'view' | 'download') => {
    try {
      setActionLoading(true);
      const blob = await downloadDocument(doc.document_id);
      const url = window.URL.createObjectURL(blob);
      
      if (action === 'view') {
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000); 
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || `Failed to ${action} document.` });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!applicationId) return;
      try {
        setLoading(true);
        const [appRes, docsRes, userRes] = await Promise.all([
          getApplicationById(applicationId),
          getApplicationDocuments(applicationId).catch(() => null), // Catch errors for missing endpoints gracefully
          getCurrentUser()
        ]);
        
        if (appRes && appRes.data) {
          setApplication(appRes.data);
          // If the backend returns documents inline, use them, otherwise use the separate fetch
          if (appRes.data.documents) {
            setDocuments(appRes.data.documents);
          } else if (docsRes && docsRes.data) {
            setDocuments(docsRes.data);
          }
        } else {
          setError('Failed to load application details.');
        }
        
        if (userRes) {
          setCurrentUser(userRes);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [applicationId]);

  const refreshApplication = async () => {
    if (!applicationId) return;
    try {
      const response = await getApplicationById(applicationId);
      if (response && response.data) {
        setApplication(response.data);
        if (response.data.documents) setDocuments(response.data.documents);
      }
    } catch (err) {
      console.error('Failed to refresh application', err);
    }
  };

  const handleWorkflowActionClick = (action: string) => {
    setPendingAction(action);
    setRemarksText('');
    setActionMessage(null);
    setShowRemarksModal(true);
  };

  const confirmWorkflowAction = async () => {
    if (!pendingAction || !applicationId) return;
    
    if ((pendingAction === 'reject' || pendingAction === 'requestCorrection') && !remarksText.trim()) {
      setActionMessage({ type: 'error', text: 'Remarks are required for this action.' });
      return;
    }
    
    setActionLoading(true);
    setActionMessage(null);
    
    try {
      switch (pendingAction) {
        case 'submit':
          await submitApplication(applicationId, remarksText);
          break;
        case 'resubmit':
          await resubmitApplication(applicationId, remarksText);
          break;
        case 'startVerification':
          await startVerification(applicationId);
          break;
        case 'requestCorrection':
          await requestCorrection(applicationId, remarksText);
          break;
        case 'completeVerification':
          await completeVerification(applicationId);
          break;
        case 'requestApproval':
          await requestApproval(applicationId);
          break;
        case 'approve':
          await approveApplication(applicationId, remarksText);
          break;
        case 'reject':
          await rejectApplication(applicationId, remarksText);
          break;
      }
      
      setActionMessage({ type: 'success', text: 'Workflow action completed successfully.' });
      setShowRemarksModal(false);
      await refreshApplication();
      
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to complete workflow action.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-loading-state">
        <div className="spinner"></div>
        <p>Loading application details...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="ad-error-state">
        <IconXCircle width={48} height={48} />
        <h2>Application Not Found</h2>
        <p>{error || 'The requested land application could not be found.'}</p>
        <button className="ad-btn-primary" onClick={() => navigate('/applications')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <IconGrid width={18} height={18} /> },
    { id: 'location', label: 'Location', icon: <IconMapPin width={18} height={18} /> },
    { id: 'documents', label: 'Documents', icon: <IconFile width={18} height={18} /> },
    { id: 'history', label: 'Workflow History', icon: <IconClock width={18} height={18} /> },
    { id: 'duplicates', label: 'Duplicates', icon: <IconDuplicateDetection width={18} height={18} /> },
  ];

  const workflowStages = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'PENDING_APPROVAL', 'APPROVED'];
  const currentStageIndex = workflowStages.indexOf(application.status) !== -1 
    ? workflowStages.indexOf(application.status) 
    : (application.status === 'CORRECTION_REQUIRED' ? 2 : 0);

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      submit: 'Submit Application',
      resubmit: 'Resubmit Application',
      startVerification: 'Start Verification',
      requestCorrection: 'Request Correction',
      completeVerification: 'Complete Verification',
      requestApproval: 'Request Approval',
      approve: 'Approve Application',
      reject: 'Reject Application'
    };
    return map[action] || action;
  };

  // Safe cast for loosely typed fields
  const appData = application as any;

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
              <Link to="/applications">Applications</Link>
              <span className="separator">&gt;</span>
              <span className="current">{application.application_id}</span>
            </div>
          </div>
          
          <div className="ad-hero-bottom">
            <div className="ad-hero-text">
              <h1>Land Application Details</h1>
              <p>Review workflow progress, documents, and details for this application.</p>
            </div>
            {application.status === 'APPROVED' && appData.asset_id && (
              <div className="ad-hero-actions">
                <button 
                  className="ad-btn-primary" 
                  style={{ backgroundColor: '#0F9D58', border: 'none' }}
                  onClick={() => navigate(`/assets/${appData.asset_id}`)}
                >
                  <IconCheckCircle width={18} height={18} /> View Official Asset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="ad-summary-wrapper">
        <div className="ad-summary-card">
          <div className="summary-item-group asset-id-group">
            <div className="summary-icon-wrapper" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <IconLayers width={28} height={28} />
            </div>
            <div className="summary-item">
              <span className="summary-label">App ID</span>
              <span className="summary-value highlight">{application.application_id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="summary-separator"></div>
          
          <div className="summary-item">
            <span className="summary-label">Status</span>
            <span className={`ad-status-badge ${application.status.toLowerCase()}`}>
              {formatStatus(application.status)}
            </span>
          </div>
          <div className="summary-separator"></div>
            
          <div className="summary-item">
            <span className="summary-label">Created Date</span>
            <span className="summary-value">{new Date(application.created_at).toLocaleDateString()}</span>
          </div>
          <div className="summary-separator"></div>
          
          <div className="summary-item">
            <span className="summary-label">Survey Number</span>
            <span className="summary-value">{appData.survey_no || 'N/A'}</span>
          </div>
          <div className="summary-separator"></div>
          
          <div className="summary-item">
            <span className="summary-label">Area (Acres)</span>
            <span className="summary-value">{application.area != null ? application.area.toString() : 'N/A'}</span>
          </div>
          <div className="summary-separator"></div>
          
          <div className="summary-item">
            <span className="summary-label">Owner</span>
            <span className="summary-value">{appData.owner_name || 'N/A'}</span>
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
                  <IconFile width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Application Information</h3>
                  <p>Details submitted by the applicant.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-list two-column">
                  <div className="ad-info-row">
                    <span className="label">Application ID</span>
                    <span className="value">{application.application_id}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Applicant ID</span>
                    <span className="value">{application.applicant_id}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Survey Number</span>
                    <span className="value">{appData.survey_no || 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Asset Type</span>
                    <span className="value" style={{ textTransform: 'capitalize' }}>{appData.asset_type || 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Area (Acres)</span>
                    <span className="value">{application.area != null ? application.area.toString() : 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Owner Name</span>
                    <span className="value">{appData.owner_name || 'Not available'}</span>
                  </div>
                </div>
                <div className="ad-info-row full-width" style={{ marginTop: '16px', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="label">Description</span>
                  <p className="description-value">{appData.description || 'Not available'}</p>
                </div>
              </div>
            </div>
            
            {/* Correction State Warning */}
            {application.status === 'CORRECTION_REQUIRED' && (
              <div className="ad-info-card" style={{ borderLeft: '4px solid #F59E0B' }}>
                <div className="ad-card-header">
                  <div className="ad-card-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <IconXCircle width={24} height={24} />
                  </div>
                  <div className="ad-card-title-group">
                    <h3>Correction Required</h3>
                    <p>The verification officer has requested changes.</p>
                  </div>
                </div>
                <div className="ad-card-body">
                  <p style={{ margin: 0, padding: '12px', backgroundColor: '#FFFBEB', borderRadius: '4px', color: '#92400E' }}>
                    Please review the workflow history for detailed remarks and update your application or documents accordingly before resubmitting.
                  </p>
                </div>
              </div>
            )}
            
            {/* Rejected State Warning */}
            {application.status === 'REJECTED' && (
              <div className="ad-info-card" style={{ borderLeft: '4px solid #EF4444' }}>
                <div className="ad-card-header">
                  <div className="ad-card-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                    <IconXCircle width={24} height={24} />
                  </div>
                  <div className="ad-card-title-group">
                    <h3>Application Rejected</h3>
                    <p>This land application has been rejected.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="ad-overview-col">
            {/* Workflow Control Panel */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#FFEDD5', color: '#EA580C' }}>
                  <IconWorkflow width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Workflow Actions</h3>
                  <p>Manage the lifecycle of this application.</p>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-workflow-horizontal" style={{ marginBottom: '24px' }}>
                  {workflowStages.map((stage, index) => {
                    const isCompleted = index <= currentStageIndex;
                    const isActive = index === currentStageIndex && application.status !== 'CORRECTION_REQUIRED';
                    const isRejected = application.status === 'REJECTED';
                    const isCorrection = application.status === 'CORRECTION_REQUIRED' && stage === 'UNDER_REVIEW';
                    
                    return (
                      <div key={stage} className={`ad-hz-step ${isCompleted && !isRejected ? 'completed' : ''} ${isActive && !isRejected ? 'active' : ''} ${isCorrection ? 'correction' : ''}`}>
                        <div className="ad-hz-marker" style={isCorrection ? { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' } : {}}>
                          {isCompleted && !isRejected && !isCorrection ? <IconCheckCircle width={16} height={16} /> : <div className="ad-dot" />}
                        </div>
                        <p className="ad-hz-title">{formatStatus(stage)}</p>
                        {index < workflowStages.length - 1 && <div className="ad-hz-line"></div>}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                  {currentUser && (
                    <>
                      {currentUser.role === 'APPLICANT' && ['DRAFT', 'CORRECTION_REQUIRED'].includes(application.status) && (
                        <button className="ad-btn-secondary" onClick={() => navigate(`/applications/${application.application_id}/edit`)}>Edit Application</button>
                      )}
                      {currentUser.role === 'APPLICANT' && application.status === 'DRAFT' && (
                        <button className="ad-btn-primary" onClick={() => handleWorkflowActionClick('submit')}>Submit Application</button>
                      )}
                      {currentUser.role === 'APPLICANT' && application.status === 'CORRECTION_REQUIRED' && (
                        <button className="ad-btn-primary" onClick={() => handleWorkflowActionClick('resubmit')}>Resubmit Application</button>
                      )}
                      
                      {(currentUser.role === 'VERIFICATION_OFFICER' || currentUser.role === 'ADMIN') && application.status === 'SUBMITTED' && (
                        <button className="ad-btn-primary" onClick={() => handleWorkflowActionClick('startVerification')}>Start Verification</button>
                      )}
                      {(currentUser.role === 'VERIFICATION_OFFICER' || currentUser.role === 'ADMIN') && application.status === 'UNDER_REVIEW' && (
                        <>
                          <button className="ad-btn-secondary" onClick={() => handleWorkflowActionClick('requestCorrection')}>Request Correction</button>
                          <button className="ad-btn-primary" onClick={() => handleWorkflowActionClick('completeVerification')}>Complete Verification</button>
                        </>
                      )}
                      {(currentUser.role === 'VERIFICATION_OFFICER' || currentUser.role === 'ADMIN') && application.status === 'VERIFIED' && (
                        <button className="ad-btn-primary" onClick={() => handleWorkflowActionClick('requestApproval')}>Request Approval</button>
                      )}

                      {(currentUser.role === 'APPROVING_AUTHORITY' || currentUser.role === 'ADMIN') && application.status === 'PENDING_APPROVAL' && (
                        <>
                          <button className="ad-btn-primary" style={{ backgroundColor: '#0F9D58', border: 'none' }} onClick={() => handleWorkflowActionClick('approve')}>Approve</button>
                          <button className="ad-btn-primary" style={{ backgroundColor: '#EF4444', border: 'none' }} onClick={() => handleWorkflowActionClick('reject')}>Reject</button>
                        </>
                      )}
                    </>
                  )}
                  {(!currentUser || (currentUser.role === 'APPLICANT' && !['DRAFT', 'CORRECTION_REQUIRED'].includes(application.status))) && (
                    <span style={{ color: '#64748B', fontSize: '0.875rem' }}>No actions available for your role at this stage.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Summary */}
            <div className="ad-info-card">
              <div className="ad-card-header">
                <div className="ad-card-icon" style={{ backgroundColor: '#ECFDF5', color: '#0F9D58' }}>
                  <IconMapPin width={24} height={24} />
                </div>
                <div className="ad-card-title-group">
                  <h3>Location</h3>
                </div>
              </div>
              <div className="ad-card-body">
                <div className="ad-info-list">
                  <div className="ad-info-row">
                    <span className="label">Latitude</span>
                    <span className="value">{application.latitude != null ? application.latitude.toFixed(6) : 'Not available'}</span>
                  </div>
                  <div className="ad-info-row">
                    <span className="label">Longitude</span>
                    <span className="value">{application.longitude != null ? application.longitude.toFixed(6) : 'Not available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB CONTENT */}
      {activeTab === 'documents' && (
        <div className="ad-info-card">
          <div className="ad-card-header">
            <div className="ad-card-icon" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
              <IconFile width={24} height={24} />
            </div>
            <div className="ad-card-title-group">
              <h3>Application Documents</h3>
              <p>Supporting files for this application.</p>
            </div>
            {currentUser && currentUser.role === 'APPLICANT' && ['DRAFT', 'CORRECTION_REQUIRED'].includes(application.status) && (
              <>
                <button className="ad-btn-primary small" onClick={() => fileInputRef.current?.click()} disabled={actionLoading}>Upload Document</button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUploadDocument}
                />
              </>
            )}
          </div>
          <div className="ad-card-body">
            {documents && documents.length > 0 ? (
              <div className="ad-document-list">
                {documents.map((doc, index) => (
                  <div key={doc.document_id || index} className="ad-document-item">
                    <IconFile width={20} height={20} color="#64748B" />
                    <div className="doc-info">
                      <span className="doc-name">{doc.file_name}</span>
                      <span className="doc-meta">{doc.document_type} • {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="ad-btn-icon" onClick={() => handleDocumentAction(doc, 'view')} title="View" disabled={actionLoading}><span style={{fontSize: '12px', fontWeight: 'bold'}}>VIEW</span></button>
                      <button className="ad-btn-icon" onClick={() => handleDocumentAction(doc, 'download')} title="Download" disabled={actionLoading}><IconDownload width={16} height={16} /></button>
                      {currentUser?.role === 'APPLICANT' && ['DRAFT', 'CORRECTION_REQUIRED'].includes(application.status) && (
                        <button className="ad-btn-icon" onClick={() => handleDeleteDocument(doc.document_id)} style={{ color: '#EF4444' }} title="Delete" disabled={actionLoading}><IconXCircle width={16} height={16} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ad-empty-state">
                <IconFile width={32} height={32} color="#94A3B8" />
                <p>No documents uploaded for this application.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="ad-info-card">
          <div className="ad-card-header">
            <div className="ad-card-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <IconClock width={24} height={24} />
            </div>
            <div className="ad-card-title-group">
              <h3>Workflow History</h3>
              <p>Complete audit trail of this application.</p>
            </div>
          </div>
          <div className="ad-card-body">
            {application.workflow && application.workflow.length > 0 ? (
              <div className="ad-timeline">
                {application.workflow.map((event, index) => (
                  <div key={event.history_id || index} className="ad-timeline-item">
                    <div className="ad-timeline-marker"></div>
                    <div className="ad-timeline-content">
                      <p className="ad-timeline-title">Transition to {formatStatus(event.new_status)}</p>
                      {event.remarks && <p className="ad-timeline-desc" style={{ fontStyle: 'italic', color: '#475569' }}>"{event.remarks}"</p>}
                      <p className="ad-timeline-desc" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        Status changed from {event.previous_status ? formatStatus(event.previous_status) : 'None'} to {formatStatus(event.new_status)}
                      </p>
                      <small className="ad-timeline-time">{new Date(event.action_time).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ad-empty-state">
                <p>No workflow history available yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DUPLICATES TAB CONTENT */}
      {activeTab === 'duplicates' && (
        <div className="ad-info-card">
          <div className="ad-card-header">
            <div className="ad-card-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
              <IconDuplicateDetection width={24} height={24} />
            </div>
            <div className="ad-card-title-group">
              <h3>Duplicate Flags</h3>
              <p>Potential conflicts with existing records.</p>
            </div>
          </div>
          <div className="ad-card-body">
            {(!currentUser || currentUser.role === 'APPLICANT') ? (
              <div className="ad-empty-state">
                <p>Duplicate analysis is performed during official verification.</p>
              </div>
            ) : application.duplicate_flags && application.duplicate_flags.length > 0 ? (
              <div className="ad-document-list">
                {application.duplicate_flags.map((flag, index) => (
                  <div key={flag.flag_id || index} className="ad-document-item" style={{ borderLeft: '3px solid #EF4444' }}>
                    <div className="doc-info" style={{ marginLeft: '12px' }}>
                      <span className="doc-name">Similarity Score: {(flag.similarity_score * 100).toFixed(1)}%</span>
                      <span className="doc-meta">Conflicting Asset: {flag.candidate_asset_id} | Status: {formatStatus(flag.review_status)}</span>
                      {flag.remarks && <p style={{ fontSize: '0.875rem', marginTop: '4px', color: '#475569' }}>{flag.remarks}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ad-empty-state">
                <IconCheckCircle width={32} height={32} color="#0F9D58" />
                <p>No duplicates detected.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTHER TABS PLACEHOLDER */}
      {activeTab === 'location' && (
        <div className="ad-empty-state large">
          <IconMapPin width={48} height={48} color="#CBD5E1" />
          <h3>Location Data</h3>
          <p>Detailed GIS mapping view will be displayed here.</p>
        </div>
      )}

      {/* Action Messages */}
      {actionMessage && !showRemarksModal && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', padding: '16px 24px',
          backgroundColor: actionMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          color: actionMessage.type === 'success' ? '#0F9D58' : '#EF4444',
          borderRadius: '8px', border: `1px solid ${actionMessage.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {actionMessage.type === 'success' ? <IconCheckCircle width={20} height={20} /> : <IconXCircle width={20} height={20} />}
          {actionMessage.text}
        </div>
      )}

      {/* Remarks Modal */}
      {showRemarksModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', color: '#1E293B' }}>
              Confirm Action: {getActionLabel(pendingAction || '')}
            </h2>
            
            {actionMessage && (
              <div style={{
                padding: '12px', marginBottom: '16px', borderRadius: '6px',
                backgroundColor: actionMessage.type === 'error' ? '#FEF2F2' : '#ECFDF5',
                color: actionMessage.type === 'error' ? '#EF4444' : '#0F9D58',
                fontSize: '0.875rem'
              }}>
                {actionMessage.text}
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: 500, fontSize: '0.875rem' }}>
                Remarks {(pendingAction === 'reject' || pendingAction === 'requestCorrection') ? '(Required)' : '(Optional)'}
              </label>
              <textarea 
                value={remarksText}
                onChange={(e) => setRemarksText(e.target.value)}
                rows={4}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px',
                  border: '1px solid #CBD5E1', resize: 'none',
                  fontFamily: 'inherit', fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter any relevant remarks..."
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="ad-btn-secondary" 
                onClick={() => { setShowRemarksModal(false); setActionMessage(null); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="ad-btn-primary" 
                onClick={confirmWorkflowAction}
                disabled={actionLoading}
                style={(pendingAction === 'reject' || pendingAction === 'requestCorrection') ? { backgroundColor: '#EF4444', borderColor: '#EF4444' } : {}}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;
