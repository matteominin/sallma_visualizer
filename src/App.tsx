import { Routes, Route, NavLink } from 'react-router';
import { useState } from 'react';
import './App.css'
import Home from './pages/home/Home';
import Workflows from './pages/workflows/Workflows';
import WorkflowDetails from './pages/workflowDetails/WorkflowDetails';


function App() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    const mongoUri = localStorage.getItem('mongoUri');
    const dbName = localStorage.getItem('dbName');
    
    if (!mongoUri || !dbName) {
      alert('No database connection found. Please connect to MongoDB first.');
      return;
    }

    setRefreshing(true);
    try {
      const res = await fetch('http://localhost:4000/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri, dbName })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('meta_workflows', JSON.stringify(data.workflows));
        // Trigger a page reload to refresh all components
        window.location.reload();
      } else {
        alert(`Failed to refresh: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error refreshing workflows: ${err.message || 'Unknown error'}`);
    }
    setRefreshing(false);
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/workflows" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Workflows
            </NavLink>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="nav-btn"
          >
            {refreshing ? (
              <>
                <span>⟳</span>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </nav>
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/workflows/:id" element={<WorkflowDetails />} />
        </Routes>
      </main>
    </>
  );
}

export default App
