import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAsset } from '../../services/assetService';
import type { CreateAssetInput } from '../../services/assetService';
import { IconFile, IconUsers, IconMapPin, IconSend } from '../icons/Icons';
import './AddAsset.css';

const AddAsset = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const payload: CreateAssetInput = {
        land_id: formData.land_id.trim(),
        survey_no: formData.survey_no.trim(),
        owner_name: formData.owner_name.trim(),
        area: areaVal,
        latitude: latVal,
        longitude: lngVal,
        asset_type: formData.asset_type.trim(),
        description: formData.description.trim() || null,
        status: 'DRAFT'
      };

      const response = await createAsset(payload);
      if (response && response.status === 'success') {
        setSuccess("Land asset created successfully.");
        setFormData(initialFormState);
        setTimeout(() => {
          navigate('/assets');
        }, 1500);
      } else {
        throw new Error('Creation failed');
      }
    } catch (err) {
      setError("Unable to create land asset. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-asset-page">
      {/* Page Header / Hero */}
      <div className="add-asset-hero-container">
        <section className="add-asset-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <p className="hero-breadcrumb">
              LAND ASSETS &gt; <span>ADD NEW ASSET</span>
            </p>
            <h1 className="hero-title">Add New Land Asset</h1>
            <p className="hero-subtitle">Register a new land asset with complete and accurate details.</p>
          </div>
        </section>
      </div>

      <div className="add-asset-container">
        <form onSubmit={handleSubmit} className="add-asset-form">
          {error && <div className="add-asset-alert add-asset-alert-error">{error}</div>}
          {success && <div className="add-asset-alert add-asset-alert-success">{success}</div>}

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
                <span className="system-info-badge">Auto-generated after creation</span>
              </div>
              <div className="system-info-item">
                <span className="system-info-label">Status</span>
                <span className="system-info-badge">Draft after creation</span>
              </div>
            </div>

            <div className="add-asset-actions">
              <button 
                type="button" 
                className="add-asset-btn-secondary" 
                onClick={() => navigate('/assets')} 
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
                {isSubmitting ? 'Creating...' : 'Create Asset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAsset;
