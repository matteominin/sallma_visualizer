import {useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router';

const WorkflowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<any>(null);
  const [metaNodes, setMetaNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    // Get workflows from localStorage
    const workflows = JSON.parse(localStorage.getItem('meta_workflows') || '[]');
    const wf = workflows.find((w: any, idx: number) => (w._id ? w._id.toString() : idx.toString()) === id);
    setWorkflow(wf);
    if (wf && wf.nodes && wf.nodes.length > 0) {
      // Get MongoDB connection info from localStorage
      const mongoUri = localStorage.getItem('mongoUri');
      const dbName = localStorage.getItem('dbName');
      const nodes = wf.nodes.map((node: any) => ({ metamodelId: node.metamodelId, type: node.type })).filter(Boolean);
      if (mongoUri && dbName && nodes.length > 0) {
        fetch('http://localhost:4000/api/meta_nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mongoUri, dbName, nodes })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setMetaNodes(data.nodes);
            } else {
              setMetaNodes([]);
            }
          })
          .catch(() => setMetaNodes([]));
      } else {
        setMetaNodes([]);
      }
    } else {
      setMetaNodes([]);
    }
  }, [id]);

  if (!workflow) return <div><h1>Workflow Details</h1><p>Workflow not found.</p></div>;

  // Helper to get node details by metamodelId
  const getNodeDetails = (node: any) => {
    return metaNodes.find((mn: any) => mn._id === node.metamodelId);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1 className="page-title">{workflow.name || 'Workflow Details'}</h1>
        <div className="grid grid-2 mb-4">
          <div>
            <div className="mb-2"><strong>ID:</strong> <span style={{ fontFamily: 'monospace', color: '#718096' }}>{workflow._id}</span></div>
            <div><strong>Description:</strong> <span style={{ color: '#4a5568' }}>{workflow.description || 'No description available.'}</span></div>
          </div>
          <div style={{ textAlign: 'right', color: '#718096' }}>
            <div>Nodes: {workflow.nodes?.length || 0}</div>
            <div>Edges: {workflow.edges?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="card">
        <h2 className="section-title">Graph Visualization</h2>
        {workflow.nodes && workflow.nodes.length > 0 ? (
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', overflowX: 'auto' }}>
            <svg width={Math.max(600, 180 * workflow.nodes.length)} height={400} style={{ display: 'block', margin: '0 auto' }}>
              {/* Draw edges: straight for adjacent, curved for overlapping/non-adjacent */}
              {workflow.edges && workflow.edges.map((edge: any, idx: number) => {
                const sourceIdx = workflow.nodes.findIndex((n: any) => n._id === edge.sourceNodeId);
                const targetIdx = workflow.nodes.findIndex((n: any) => n._id === edge.targetNodeId);
                if (sourceIdx === -1 || targetIdx === -1) return null;
                const x1 = 90 + sourceIdx * 180;
                const y1 = 200;
                const x2 = 90 + targetIdx * 180;
                const y2 = 200;
                const nodeRadius = 50;
                
                // Check for straight (adjacent) edge
                const isStraight = Math.abs(targetIdx - sourceIdx) === 1;
                // Check for overlap: multiple edges between same pair
                const overlapCount = workflow.edges.filter((e: any) =>
                  (e.sourceNodeId === edge.sourceNodeId && e.targetNodeId === edge.targetNodeId)
                ).length;
                
                if (isStraight && overlapCount === 1) {
                  // Draw straight line with oriented arrow
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const angle = Math.atan2(dy, dx);
                  // Calculate start and end points at node borders
                  const startX = x1 + Math.cos(angle) * nodeRadius;
                  const startY = y1 + Math.sin(angle) * nodeRadius;
                  const endX = x2 - Math.cos(angle) * nodeRadius;
                  const endY = y2 - Math.sin(angle) * nodeRadius;
                  
                  return (
                    <g key={edge._id || idx}>
                      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#333" strokeWidth={2} markerEnd="url(#arrow)" />
                    </g>
                  );
                } else {
                  // Draw curved arc with oriented arrow
                  const arcHeight = Math.abs(targetIdx - sourceIdx) * 80 + 80 + (idx % 2 === 0 ? 0 : 40); // more round
                  const sweepFlag = sourceIdx < targetIdx ? 1 : 0;
                  
                  // Calculate start and end points at node borders for curved path
                  const dx = x2 - x1;
                  const baseAngle = Math.atan2(0, dx); // horizontal direction initially
                  const curveAngle = sweepFlag === 1 ? baseAngle - Math.PI/8 : baseAngle + Math.PI/8;
                  
                  const startX = x1 + Math.cos(curveAngle) * nodeRadius;
                  const startY = y1 + Math.sin(curveAngle) * nodeRadius;
                  const endX = x2 - Math.cos(-curveAngle) * nodeRadius;
                  const endY = y2 - Math.sin(-curveAngle) * nodeRadius;
                  
                  return (
                    <g key={edge._id || idx}>
                      <path
                        d={`M${startX},${startY} A${arcHeight},${arcHeight} 0 0,${sweepFlag} ${endX},${endY}`}
                        stroke="#333"
                        strokeWidth={2}
                        fill="none"
                        markerEnd="url(#arrow)"
                      />
                    </g>
                  );
                }
              })}
              {/* Draw loop arcs for nodes with loopSettings */}
              {workflow.nodes.map((node: any, idx: number) => {
                if (node.loopSettings) {
                  const x = 90 + idx * 180;
                  const y = 180;
                  const r = 30; // node radius
                  // Loop arc starts and ends at the node's edge, and is more round
                  return (
                    <path
                      key={node._id + '-loop'}
                      d={`M${x - r},${y - r} Q${x},${y - r - 80} ${x + r},${y - r}`}
                      stroke="#e53e3e"
                      strokeWidth={2}
                      fill="none"
                      markerEnd="url(#arrowLoop)"
                    />
                  );
                }
                return null;
              })}
              {/* Arrow marker for edges */}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#333" />
                </marker>
                <marker id="arrowLoop" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#e53e3e" />
                </marker>
              </defs>
              {/* Draw nodes */}
              {workflow.nodes.map((node: any, idx: number) => {
                const x = 90 + idx * 180;
                const y = 200;
                const details = getNodeDetails(node);
                return (
                  <g key={node._id || idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedNodeId(node._id)}>
                    <circle cx={x} cy={y} r={50} fill={selectedNodeId === node._id ? '#fbbf24' : '#90cdf4'} stroke="#2b6cb0" strokeWidth={4} />
                    <text x={x} y={y} textAnchor="middle" dy=".3em" fontSize={22} fontWeight={700} fill="#2b6cb0">{node._id}</text>
                    <text x={x} y={y + 70} textAnchor="middle" fontSize={16} fill="#2b6cb0">
                      {details && details.name ? details.name : 'Unnamed'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="text-center" style={{ padding: '3rem', color: '#718096' }}>
            <p>No nodes to display in graph.</p>
          </div>
        )}
      </div>

      {/* Node Details */}
      <div className="card">
        <h2 className="section-title">Node Details</h2>
        {selectedNodeId ? (
          (() => {
            const node = workflow.nodes.find((n: any) => n._id === selectedNodeId);
            const details = node ? getNodeDetails(node) : null;
            if (!node) return null;
            if (node.type === 'SUB_WORKFLOW') {
              return (
                <div style={{ border: '2px solid #3182ce', borderRadius: '12px', padding: '1.5rem', background: '#f7fafc' }}>
                  <div className="mb-2"><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{node._id}</span></div>
                  <div className="mb-2"><strong>Metamodel ID:</strong> <span style={{ fontFamily: 'monospace' }}>{node.metamodelId}</span></div>
                  <div className="mb-3"><strong>Type:</strong> <span style={{ color: '#e53e3e', fontWeight: 600 }}>{node.type}</span></div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(`/workflows/${node.metamodelId}`)} className="btn btn-primary">
                      Go to Sub-Workflow
                    </button>
                    <button onClick={() => setSelectedNodeId(null)} className="btn btn-secondary">
                      Close
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div style={{ border: '2px solid #3182ce', borderRadius: '12px', padding: '1.5rem', background: '#f7fafc' }}>
                <div className="mb-2"><strong>ID:</strong> <span style={{ fontFamily: 'monospace' }}>{node._id}</span></div>
                <div className="mb-2"><strong>Metamodel ID:</strong> <span style={{ fontFamily: 'monospace' }}>{node.metamodelId}</span></div>
                <div className="mb-2"><strong>Type:</strong> <span style={{ color: '#38a169', fontWeight: 600 }}>{node.type}</span></div>
                {details && (
                  <div className="mb-3"><strong>Name:</strong> {details.name || details._id || 'Unnamed'}</div>
                )}
                <div className="mb-3">
                  <strong>Details:</strong>
                  <pre style={{ 
                    background: '#e2e8f0', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflow: 'auto',
                    marginTop: '0.5rem'
                  }}>
                    {details ? JSON.stringify(details, null, 2) : 'No details found.'}
                  </pre>
                </div>
                <button onClick={() => setSelectedNodeId(null)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            );
          })()
        ) : (
          <div className="text-center" style={{ padding: '2rem', color: '#718096' }}>
            <p>Click a node in the graph to see details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowDetails