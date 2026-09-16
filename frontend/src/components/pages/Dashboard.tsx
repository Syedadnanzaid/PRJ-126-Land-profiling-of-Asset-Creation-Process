import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-welcome">
        <h2>Welcome to Land Asset Governance Platform</h2>
        <p>System Overview & Status Dashboard</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Total Land Assets</h3>
            <span className="badge info">Records</span>
          </div>
          <p className="stat-value">0</p>
          <p className="stat-trend neutral">No assets registered</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Pending Workflows</h3>
            <span className="badge warning">Action Req.</span>
          </div>
          <p className="stat-value">0</p>
          <p className="stat-trend neutral">No pending workflows</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Duplicate Flags</h3>
            <span className="badge danger">Alerts</span>
          </div>
          <p className="stat-value">0</p>
          <p className="stat-trend neutral">No active flags</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <h3>Approved Assets</h3>
            <span className="badge success">Verified</span>
          </div>
          <p className="stat-value">0</p>
          <p className="stat-trend neutral">No approved assets</p>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section recent-assets">
          <h3>Recent Asset Registrations</h3>
          <div className="table-responsive">
            <div className="empty-state">
              <p>No land assets registered yet.</p>
              <p className="empty-state-subtext">Create a land asset to see it appear here.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section asset-status">
          <h3>Asset Status Overview</h3>
          <div className="status-chart-placeholder">
            <div className="empty-state">
              <p>No data available to display.</p>
              <p className="empty-state-subtext">Status charts will appear once assets are added.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
