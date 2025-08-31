import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  ConnectionLineType,
  MarkerType,
  Position,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import dagre from 'dagre';

import 'reactflow/dist/style.css';

// Styles for better edge interaction
const customStyles = `
  .react-flow__edge .react-flow__edge-path {
    stroke: #000000;
    stroke-width: 2;
  }
  
  .react-flow__arrowhead {
    fill: #000000;
    stroke: #000000;
  }
  
  /* Make edges easier to click */
  .react-flow__edge {
    pointer-events: all;
  }
  
  .react-flow__edge:hover .react-flow__edge-path {
    stroke: #4f46e5;
    stroke-width: 3;
  }
`;

// Standard dagre layout function
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 200, ranksep: 300 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 140, height: 180 }); // Account for smaller node + text below
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 70,
        y: nodeWithPosition.y - 90,
      },
      draggable: false,
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Custom node styles
const nodeStyle = {
  background: 'linear-gradient(135deg, #90cdf4 0%, #60a5fa 100%)',
  color: '#2b6cb0',
  border: '4px solid #2b6cb0',
  width: 120,
  height: 120,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(96, 165, 250, 0.3)',
};

const selectedNodeStyle = {
  ...nodeStyle,
  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  border: '4px solid #d97706',
  boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
};

const loopNodeStyle = {
  background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
  color: '#be185d',
  border: '4px solid #be185d',
  width: 120,
  height: 120,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(244, 114, 182, 0.3)',
};

const WorkflowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<any>(null);
  const [metaNodes, setMetaNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    // Get workflows from localStorage
    const workflows = JSON.parse(localStorage.getItem('meta_workflows') || '[]');
    const wf = workflows.find((w: any, idx: number) => (w._id ? w._id.toString() : idx.toString()) === id);
    setWorkflow(wf);

    if (wf && wf.nodes && wf.nodes.length > 0) {
      // Get MongoDB connection info from localStorage
      const mongoUri = localStorage.getItem('mongoUri');
      const dbName = localStorage.getItem('dbName');
      const nodesData = wf.nodes.map((node: any) => ({ metamodelId: node.metamodelId, type: node.type })).filter(Boolean);

      if (mongoUri && dbName && nodesData.length > 0) {
        fetch('http://localhost:4000/api/meta_nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mongoUri, dbName, nodes: nodesData })
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

  // Helper to get node details by metamodelId
  const getNodeDetails = (node: any) => {
    return metaNodes.find((mn: any) => mn._id === node.metamodelId);
  };

  // Create ReactFlow nodes and edges when workflow data changes
  useEffect(() => {
    if (workflow && workflow.nodes && workflow.edges) {
      // Create nodes
      const flowNodes: Node[] = workflow.nodes.map((node: any) => {
        const details = getNodeDetails(node);
        const isSelected = selectedNodeId === node._id;
        const hasLoop = node.loopSettings != null;

        // Choose style based on selection and loop status
        let nodeStyleToUse = nodeStyle;
        if (isSelected) {
          nodeStyleToUse = selectedNodeStyle;
        } else if (hasLoop) {
          nodeStyleToUse = loopNodeStyle;
        }

        return {
          id: node._id.toString(),
          type: 'default',
          position: { x: 0, y: 0 }, // Will be set by layout
          data: {
            label: (
              <div style={{ textAlign: 'center', position: 'relative' }}>
                {/* Smaller circle with ID */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: hasLoop ? '#be185d' : '#2b6cb0'
                }}>
                  {node._id}
                </div>
                {/* Larger text positioned below the circle */}
                <div style={{
                  position: 'absolute',
                  top: '130px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '26px',
                  fontWeight: '600',
                  maxWidth: '200px',
                  wordWrap: 'break-word',
                  color: '#374151',
                  textAlign: 'center'
                }}>
                  {details?.name || 'Unnamed'}
                </div>
              </div>
            ),
            nodeData: node,
            details: details
          },
          style: nodeStyleToUse,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });

      // Create edges with easier clicking
      const flowEdges: Edge[] = workflow.edges.map((edge: any, index: number) => ({
        id: edge._id || `edge-${index}`,
        source: edge.sourceNodeId.toString(),
        target: edge.targetNodeId.toString(),
        type: 'bezier',
        animated: false,
        style: {
          stroke: '#000000',
          strokeWidth: 2,
          strokeLinecap: 'round',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#000000',
        },
        // Add invisible wider stroke for easier clicking
        interactionWidth: 20,
      }));

      // No loop edges - we'll use custom SVG components instead
      const allEdges = flowEdges;

      // Apply layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, allEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [workflow, metaNodes, selectedNodeId, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

  if (!workflow) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="card">
          <h1>Workflow Details</h1>
          <p>Workflow not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="card">
        <h1 className="page-title">{workflow.name || 'Workflow Details'}</h1>
        <div className="grid grid-2 mb-4">
          <div>
            <div className="mb-2">
              <strong>ID:</strong>
              <span style={{ fontFamily: 'monospace', color: '#718096', marginLeft: '8px' }}>
                {workflow._id}
              </span>
            </div>
            <div>
              <strong>Description:</strong>
              <span style={{ color: '#4a5568', marginLeft: '8px' }}>
                {workflow.description || 'No description available.'}
              </span>
            </div>
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
          <div style={{ height: '600px', background: '#f8fafc', borderRadius: '12px' }}>
            <style>{customStyles}</style>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              fitView
              attributionPosition="bottom-left"
              connectionLineType={ConnectionLineType.Bezier}
              defaultEdgeOptions={{
                type: 'bezier',
                style: { stroke: '#000000', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#000000' }
              }}
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor="#60a5fa"
                maskColor="rgba(255, 255, 255, 0.8)"
                position="top-right"
                style={{
                  width: 120,
                  height: 80,
                }}
              />
              <Panel position="top-left">
                <div style={{
                  background: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  Click a node to see details
                </div>
              </Panel>
            </ReactFlow>
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
            const node = workflow.nodes.find((n: any) => n._id.toString() === selectedNodeId);
            const details = node ? getNodeDetails(node) : null;

            if (!node) return null;

            if (node.type === 'SUB_WORKFLOW') {
              return (
                <div style={{
                  border: '2px solid #3182ce',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  background: '#f7fafc'
                }}>
                  <div className="mb-2">
                    <strong>ID:</strong>
                    <span style={{ fontFamily: 'monospace', marginLeft: '8px' }}>{node._id}</span>
                  </div>
                  <div className="mb-2">
                    <strong>Metamodel ID:</strong>
                    <span style={{ fontFamily: 'monospace', marginLeft: '8px' }}>{node.metamodelId}</span>
                  </div>
                  <div className="mb-3">
                    <strong>Type:</strong>
                    <span style={{ color: '#e53e3e', fontWeight: 600, marginLeft: '8px' }}>{node.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate(`/workflows/${node.metamodelId}`)}
                      className="btn btn-primary"
                    >
                      Go to Sub-Workflow
                    </button>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="btn btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div style={{
                border: '2px solid #3182ce',
                borderRadius: '12px',
                padding: '1.5rem',
                background: '#f7fafc'
              }}>
                <div className="mb-2">
                  <strong>ID:</strong>
                  <span style={{ fontFamily: 'monospace', marginLeft: '8px' }}>{node._id}</span>
                </div>
                <div className="mb-2">
                  <strong>Metamodel ID:</strong>
                  <span style={{ fontFamily: 'monospace', marginLeft: '8px' }}>{node.metamodelId}</span>
                </div>
                <div className="mb-2">
                  <strong>Type:</strong>
                  <span style={{ color: '#38a169', fontWeight: 600, marginLeft: '8px' }}>{node.type}</span>
                </div>
                {details && (
                  <div className="mb-3">
                    <strong>Name:</strong>
                    <span style={{ marginLeft: '8px' }}>{details.name || details._id || 'Unnamed'}</span>
                  </div>
                )}
                {node.loopSettings && (
                  <div className="mb-3">
                    <strong>Loop Settings:</strong>
                    <span style={{
                      marginLeft: '8px',
                      color: '#e53e3e',
                      fontWeight: 600
                    }}>
                      Enabled
                    </span>
                  </div>
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
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="btn btn-secondary"
                >
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
};

export default WorkflowDetails;