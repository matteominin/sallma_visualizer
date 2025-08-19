
import React from 'react';
import { useNavigate } from 'react-router';

const Workflows = () => {
  const navigate = useNavigate();
  const workflows = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('meta_workflows') || '[]');
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 className="page-title">Workflows</h1>
      {workflows.length === 0 ? (
        <div className="card text-center">
          <p style={{ fontSize: '1.2rem', color: '#718096' }}>No workflows found.</p>
          <p style={{ color: '#a0aec0' }}>Connect to your database first to load workflows.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {workflows.map((wf: any, idx: number) => (
            <div key={wf._id || idx} className="card">
              <h3 style={{ color: '#2b6cb0', marginBottom: '1rem', fontSize: '1.3rem' }}>
                {wf.name || 'Unnamed Workflow'}
              </h3>
              <div className="mb-2">
                <strong>ID:</strong> <span style={{ color: '#718096', fontFamily: 'monospace' }}>{wf._id || idx}</span>
              </div>
              {wf.description && (
                <div className="mb-3">
                  <strong>Description:</strong> <span style={{ color: '#4a5568' }}>{wf.description}</span>
                </div>
              )}
              <div className="mb-3" style={{ color: '#718096', fontSize: '0.9rem' }}>
                <span>Nodes: {wf.nodes?.length || 0}</span> • <span>Edges: {wf.edges?.length || 0}</span>
              </div>
              <button 
                onClick={() => navigate(`/workflows/${wf._id || idx}`)}
                className="btn btn-primary"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Workflows