import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createApplication, getApplicationById, updateApplication } from '../../services/applicationService';
import type { LandApplication } from '../../services/applicationService';
import { IconFile, IconUsers, IconMapPin, IconSend } from '../icons/Icons';
import './AddAsset.css';

const AddAsset = () => {
  const { applicationId } = useParams<{ applicationId?: string }>();
  const isEditMode = !!applicationId;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [correctionRemarks, setCorrectionRemarks] = useState<string | null>(null);

  const initialFormState = {
    land_id: '',
    survey_no: '',
    owner_name: '',
    area: '',
    latitude: '',
    longitude: '',
    asset_type: '',
    description: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isEditMode && applicationId) {
      const fetchApp = async () => {
        try {
          const res = await getApplicationById(applicationId);
          if (res && res.data) {
            const app = res.data;
            if (app.status !== 'DRAFT' && app.status !== 'CORRECTION_REQUIRED') {
              navigate(`/applications/${applicationId}`);
              return;
            }
            
            if (app.status === 'CORRECTION_REQUIRED' && app.workflow) {
              const correctionEvents = app.workflow.filter(w => w.new_status === 'CORRECTION_REQUIRED');
              if (correctionEvents.length > 0) {
                correctionEvents.sort((a, b) => new Date(b.action_time).getTime() - new Date(a.action_time).getTime());
                setCorrectionRemarks(correctionEvents[0].remarks || 'No remarks provided.');
              }
            }

            setFormData({
              land_id: app.land_id || '',
              survey_no: app.survey_no || '',
              owner_name: app.owner_name || '',
              area: app.area != null ? app.area.toString() : '',
              latitude: app.latitude != null ? app.latitude.toString() : '',
              longitude: app.longitude != null ? app.longitude.toString() : '',
              asset_type: app.asset_type || '',
              description: app.description || ''
            });
          } else {
            setError("Unable to load application.");
            setFetchError(true);
          }
        } catch (err) {
          setError("Unable to load application.");
          setFetchError(true);
        } finally {
          setIsLoading(false);
        }
      };
      fetchApp();
    }
  }, [applicationId, isEditMode, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!formData.land_id.trim() || !formData.survey_no.trim() || !formData.owner_name.trim() || !formData.asset_type.trim()) {
      setError("Please fill in all required text fields.");
      return;
    }

    const areaVal = parseFloat(formData.area);
    if (isNaN(areaVal) || areaVal <= 0) {
      setError("Area must be a positive number.");
      return;
    }

    const latVal = parseFloat(formData.latitude);
    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    const lngVal = parseFloat(formData.longitude);
    if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<LandApplication> = {
        land_id: formData.land_id.trim(),
        survey_no: formData.survey_no.trim(),
        owner_name: formData.owner_name.trim(),
        area: areaVal,
        latitude: latVal,
        longitude: lngVal,
        asset_type: formData.asset_type.trim(),
        description: formData.description.trim() || null
      };

      if (isEditMode && applicationId) {
        const response = await updateApplication(applicationId, payload);
        if (response && response.status === 'success') {
          setSuccess("Land application updated successfully.");
          setTimeout(() => {
            navigate(`/applications/${applicationId}`);
          }, 1500);
        } else {
          throw new Error('Update failed');
        }
      } else {
        const response = await createApplication(payload);
        if (response && response.status === 'success') {
          setSuccess("Land application created successfully.");
          setFormData(initialFormState);
          setTimeout(() => {
            if (response.data && response.data.application_id) {
              navigate(`/applications/${response.data.application_id}`);
            } else {
              navigate('/applications');
            }
          }, 1500);
        } else {
          throw new Error('Creation failed');
        }
      }
    } catch (err) {
      setError(`Unable to ${isEditMode ? 'update' : 'create'} land application. Please try again.`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="add-asset-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p style={{ fontSize: '1.2rem', color: '#475569' }}>Loading application...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="add-asset-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="add-asset-alert add-asset-alert-error" style={{ marginBottom: '16px' }}>{error}</div>
        <button className="add-asset-btn-secondary" onClick={() => navigate('/applications')}>Back to Applications</button>
      </div>
    );
  }

  return (
    <div className="add-asset-page">
      {/* Page Header / Hero */}
      <div className="add-asset-hero-container">
        <section className="add-asset-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <p className="hero-breadcrumb">
              APPLICATIONS &gt; <span>{isEditMode ? 'EDIT APPLICATION' : 'CREATE APPLICATION'}</span>
            </p>
            <h1 className="hero-title">{isEditMode ? 'Edit Land Application' : 'Create Land Application'}</h1>
            <p className="hero-subtitle">{isEditMode ? 'Update the details of your land application.' : 'Start a new land application with complete and accurate details.'}</p>
          </div>
        </section>
      </div>

      <div className="add-asset-container">
        <form onSubmit={handleSubmit} className="add-asset-form">
          {error && !fetchError && <div className="add-asset-alert add-asset-alert-error">{error}</div>}
          {success && <div className="add-asset-alert add-asset-alert-success">{success}</div>}
          
          {correctionRemarks && (
            <div className="add-asset-alert add-asset-alert-error" style={{ backgroundColor: '#FFFBEB', color: '#92400E', borderLeft: '4px solid #F59E0B' }}>
              <strong>Correction Required: </strong> {correctionRemarks}
            </div>
          )}

          {/* Section 1: Asset Information */}
          <section className="add-asset-section">
            <div className="add-asset-section-header">
              <div className="section-icon-wrapper">
                <IconFile width={20} height={20} />
              </div>
              <div>
                <h2>Asset Information</h2>
                <p>Provide the basic details of the land asset.</p>
              </div>
            </div>
            
            <div className="add-asset-section-body">
              <div className="add-asset-form-grid">
                <div className="add-asset-field">
                  <label>Land ID *</label>
                  <input 
                    type="text" 
                    name="land_id" 
                    value={formData.land_id} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting} 
                    placeholder="e.g. LAND-PRJ126-001" 
                  />
                </div>
                
                <div className="add-asset-field">
                  <label>Survey Number *</label>
                  <input 
                    type="text" 
                    name="survey_no" 
                    value={formData.survey_no} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting} 
                    placeholder="e.g. SUR-2026-001" 
                  />
                </div>

                <div className="add-asset-field">
                  <label>Asset Type *</label>
                  <select 
                    name="asset_type" 
                    value={formData.asset_type} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting}
                  >
                    <option value="">Select Type</option>
                    <option value="Government Land">Government Land</option>
                    <option value="Private Land">Private Land</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Residential">Residential</option>
                  </select>
                </div>

                <div className="add-asset-field">
                  <label>Area (Acres) *</label>
                  <input 
                    type="number" 
                    step="any" 
                    name="area" 
                    value={formData.area} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting} 
                    placeholder="e.g. 12.50" 
                  />
                </div>
              </div>

              <div className="add-asset-field add-asset-field-full">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  disabled={isSubmitting} 
                  placeholder="Enter a brief description..." 
                />
              </div>
            </div>
          </section>

          {/* Section 2: Ownership Details */}
          <section className="add-asset-section">
            <div className="add-asset-section-header">
              <div className="section-icon-wrapper">
                <IconUsers width={20} height={20} />
              </div>
              <div>
                <h2>Ownership Details</h2>
                <p>Provide information about the owner or owning entity.</p>
              </div>
            </div>
            
            <div className="add-asset-section-body">
              <div className="add-asset-field" style={{ maxWidth: '600px' }}>
                <label>Owner / Entity *</label>
                <input 
                  type="text" 
                  name="owner_name" 
                  value={formData.owner_name} 
                  onChange={handleInputChange} 
                  required 
                  disabled={isSubmitting} 
                  placeholder="e.g. Demo Infrastructure Authority" 
                />
              </div>
            </div>
          </section>

          {/* Section 3: Location Details */}
          <section className="add-asset-section">
            <div className="add-asset-section-header">
              <div className="section-icon-wrapper">
                <IconMapPin width={20} height={20} />
              </div>
              <div>
                <h2>Location Details</h2>
                <p>Provide the geographic coordinates of the land asset.</p>
              </div>
            </div>
            
            <div className="add-asset-section-body">
              <div className="add-asset-form-grid">
                <div className="add-asset-field">
                  <label>Latitude *</label>
                  <input 
                    type="number" 
                    step="any" 
                    name="latitude" 
                    value={formData.latitude} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting} 
                    placeholder="e.g. 12.9716" 
                  />
                  <span className="add-asset-hint">Latitude must be between -90 and 90.</span>
                </div>
                
                <div className="add-asset-field">
                  <label>Longitude *</label>
                  <input 
                    type="number" 
                    step="any" 
                    name="longitude" 
                    value={formData.longitude} 
                    onChange={handleInputChange} 
                    required 
                    disabled={isSubmitting} 
                    placeholder="e.g. 77.5946" 
                  />
                  <span className="add-asset-hint">Longitude must be between -180 and 180.</span>
                </div>
              </div>
            </div>
          </section>

          {/* System Info & Actions */}
          <div className="add-asset-footer">
            <div className="add-asset-system-info">
              <div className="system-info-item">
                <span className="system-info-label">Asset ID</span>
                <span className="system-info-badge">{isEditMode ? formData.land_id || 'Auto-generated' : 'Auto-generated after creation'}</span>
              </div>
              <div className="system-info-item">
                <span className="system-info-label">Status</span>
                <span className="system-info-badge">{isEditMode ? 'Editing' : 'Draft after creation'}</span>
              </div>
            </div>

            <div className="add-asset-actions">
              <button 
                type="button" 
                className="add-asset-btn-secondary" 
                onClick={() => navigate(isEditMode ? `/applications/${applicationId}` : '/applications')} 
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="add-asset-btn-primary" 
                disabled={isSubmitting}
              >
                <IconSend width={18} height={18} />
                {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Asset')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAsset;
