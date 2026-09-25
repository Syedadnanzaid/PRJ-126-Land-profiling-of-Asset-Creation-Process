import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import PlaceholderPage from './components/pages/PlaceholderPage';
import AddAsset from './components/pages/AddAsset';
import AssetDetails from './components/pages/AssetDetails';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import GovLogin from './components/pages/GovLogin';
import GovAuthSuccess from './components/pages/GovAuthSuccess';
import ApplicationDashboard from './components/pages/ApplicationDashboard';
import ApplicationDetails from './components/pages/ApplicationDetails';
import VerificationQueue from './components/pages/VerificationQueue';
import ApprovalQueue from './components/pages/ApprovalQueue';
import AssetRegistry from './components/pages/AssetRegistry';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleProtectedRoute, Role } from './components/auth/RoleProtectedRoute';
import { 
  IconGisMap, IconDocuments, 
  IconDuplicateDetection, IconWorkflow, IconAnalytics 
} from './components/icons/Icons';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/gov-login" element={<GovLogin />} />
      <Route path="/gov-auth-success" element={<GovAuthSuccess />} />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={<Dashboard />} 
              />
              <Route 
                path="/applications" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.APPLICANT]}>
                    <ApplicationDashboard />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/verification-queue" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.VERIFICATION_OFFICER, Role.ADMIN]}>
                    <VerificationQueue />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/approval-queue" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.APPROVING_AUTHORITY, Role.ADMIN]}>
                    <ApprovalQueue />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/applications/new" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.APPLICANT]}>
                    <AddAsset />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/applications/:applicationId" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.APPLICANT, Role.VERIFICATION_OFFICER, Role.APPROVING_AUTHORITY, Role.ADMIN]}>
                    <ApplicationDetails />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/applications/:applicationId/edit" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.APPLICANT]}>
                    <AddAsset />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/assets" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.VERIFICATION_OFFICER, Role.APPROVING_AUTHORITY, Role.ADMIN]}>
                    <AssetRegistry />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/assets/:assetId" 
                element={
                  <RoleProtectedRoute allowedRoles={[Role.VERIFICATION_OFFICER, Role.APPROVING_AUTHORITY, Role.ADMIN]}>
                    <AssetDetails />
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/gis" 
                element={<PlaceholderPage title="GIS Spatial Map" description="Interactive geographical information system for mapping land boundaries." icon={<IconGisMap />} />} 
              />
              <Route 
                path="/documents" 
                element={<PlaceholderPage title="Document Repository" description="Secure storage and verification of land titles, deeds, and legal documents." icon={<IconDocuments />} />} 
              />
              <Route 
                path="/duplicates" 
                element={<PlaceholderPage title="Duplicate Detection Engine" description="AI-powered analysis to detect overlapping boundaries and duplicate claims." icon={<IconDuplicateDetection />} />} 
              />
              <Route 
                path="/workflow" 
                element={<PlaceholderPage title="Process Workflows" description="Manage approval chains and multi-stage land registration processes." icon={<IconWorkflow />} />} 
              />
              <Route 
                path="/analytics" 
                element={<PlaceholderPage title="Platform Analytics" description="Data visualization and reporting on land asset trends and platform usage." icon={<IconAnalytics />} />} 
              />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
