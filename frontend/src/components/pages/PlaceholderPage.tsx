import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

const PlaceholderPage = ({ title, description, icon }: PlaceholderPageProps) => {
  return (
    <div className="placeholder-page" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      {icon && <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>{icon}</div>}
      <h2 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>{title}</h2>
      <p style={{ maxWidth: '600px', margin: '0 auto 24px auto' }}>{description}</p>
      <div style={{ 
        padding: '24px', 
        backgroundColor: 'var(--surface-color)', 
        border: '1px dashed var(--border-color)', 
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        <p>This module is currently under development.</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>Backend API integration pending.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
