const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Serve static files from the built frontend
app.use(express.static(path.join(__dirname, 'public')));

// Test connection and fetch meta_workflows
app.post('/api/connect', async (req, res) => {
  const { mongoUri, dbName } = req.body;
  if (!mongoUri || !dbName) {
    return res.status(400).json({ error: 'Missing mongoUri or dbName' });
  }
  let client;
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections({ name: 'meta_workflows' }).toArray();
    if (collections.length === 0) {
        return res.status(404).json({ error: 'Collection meta_workflows does not exist' });
    }
    const workflows = await db.collection('meta_workflows').find({}).toArray();
    res.json({ success: true, workflows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) await client.close();
  }
});


// Fetch meta_nodes by array of metamodelIds
app.post('/api/meta_nodes', async (req, res) => {
  const { mongoUri, dbName, nodes } = req.body;
  if (!mongoUri || !dbName || !Array.isArray(nodes)) {
    return res.status(400).json({ error: 'Missing mongoUri, dbName, or nodes' });
  }

  const nodeVertices = [];
  const workflowNodes = [];
  nodes.map((node) => node.type === 'NODE' ? nodeVertices.push(node.metamodelId) : workflowNodes.push(node.metamodelId));

  let client;
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    const meta_nodes_collection = await db.listCollections({ name: 'meta_nodes' }).toArray();
    if (meta_nodes_collection.length === 0) {
      return res.status(404).json({ error: 'Collection meta_nodes does not exist' });
    }
    const meta_workflows_collection = await db.listCollections({ name: 'meta_workflows' }).toArray();
    if (meta_workflows_collection.length === 0) {
      return res.status(404).json({ error: 'Collection meta_workflows does not exist' });
    }

    const nodes = await db.collection('meta_nodes').find({ _id: { $in: nodeVertices } }).toArray();
    nodes.push(...await db.collection('meta_workflows').find({ _id: { $in: workflowNodes } }).toArray());
    res.json({ success: true, nodes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (client) await client.close();
  }
});

// Serve the React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
