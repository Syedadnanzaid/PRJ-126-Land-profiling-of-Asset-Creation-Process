import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import PlaceholderPage from './components/pages/PlaceholderPage';
import Login from './components/pages/Login';
import { 
  IconLandAssets, IconGisMap, IconDocuments, 
  IconDuplicateDetection, IconWorkflow, IconAnalytics 
} from './components/icons/Icons';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route 
              path="/assets" 
              element={<PlaceholderPage title="Land Assets Management" description="View, create, and manage digital land asset profiles." icon={<IconLandAssets />} />} 
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
      } />
    </Routes>
  );
}

export default App;
