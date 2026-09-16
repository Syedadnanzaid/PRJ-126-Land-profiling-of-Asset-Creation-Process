import { useState } from 'react';
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import PlaceholderPage from './components/pages/PlaceholderPage';
import { 
  IconLandAssets, IconGisMap, IconDocuments, 
  IconDuplicateDetection, IconWorkflow, IconAnalytics 
} from './components/icons/Icons';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('Dashboard');

  const renderContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Land Assets':
        return <PlaceholderPage title="Land Assets Management" description="View, create, and manage digital land asset profiles." icon={<IconLandAssets />} />;
      case 'GIS Map':
        return <PlaceholderPage title="GIS Spatial Map" description="Interactive geographical information system for mapping land boundaries." icon={<IconGisMap />} />;
      case 'Documents':
        return <PlaceholderPage title="Document Repository" description="Secure storage and verification of land titles, deeds, and legal documents." icon={<IconDocuments />} />;
      case 'Duplicate Detection':
        return <PlaceholderPage title="Duplicate Detection Engine" description="AI-powered analysis to detect overlapping boundaries and duplicate claims." icon={<IconDuplicateDetection />} />;
      case 'Workflow':
        return <PlaceholderPage title="Process Workflows" description="Manage approval chains and multi-stage land registration processes." icon={<IconWorkflow />} />;
      case 'Analytics':
        return <PlaceholderPage title="Platform Analytics" description="Data visualization and reporting on land asset trends and platform usage." icon={<IconAnalytics />} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderContent()}
    </Layout>
  );
}

export default App;
