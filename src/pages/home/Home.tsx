import React, { useState } from 'react';
import { useNavigate } from 'react-router';

const Home = () => {
  const [mongoUri, setMongoUri] = useState(localStorage.getItem("mongoUri") || "");
  const [dbName, setDbName] = useState(localStorage.getItem("dbName") || "");
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mongoUri, dbName })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('meta_workflows', JSON.stringify(data.workflows));
        localStorage.setItem('mongoUri', mongoUri);
        localStorage.setItem('dbName', dbName);
        navigate('/workflows');
      } else {
        setError(data.error || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 className="page-title">Connect to MongoDB</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">MongoDB URI:</label>
            <input 
              type="text" 
              value={mongoUri} 
              onChange={e => setMongoUri(e.target.value)} 
              placeholder='mongodb://localhost:27017'
              required 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Database Name:</label>
            <input 
              type="text" 
              value={dbName} 
              onChange={e => setDbName(e.target.value)} 
              placeholder='name'
              required 
              className="form-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
        {error && <p className="text-error text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}

export default Home