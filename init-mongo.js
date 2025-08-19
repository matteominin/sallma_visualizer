// MongoDB initialization script
db = db.getSiblingDB('sallma');

// Create collections if they don't exist
db.createCollection('meta_workflows');
db.createCollection('meta_nodes');

// Insert sample data for testing (optional)
db.meta_workflows.insertMany([
  {
    _id: "sample_workflow_1",
    name: "Sample Workflow 1",
    description: "A sample workflow for testing"
  },
  {
    _id: "sample_workflow_2", 
    name: "Sample Workflow 2",
    description: "Another sample workflow for testing"
  }
]);

db.meta_nodes.insertMany([
  {
    _id: "sample_node_1",
    name: "Sample Node 1",
    type: "processing",
    description: "A sample processing node"
  },
  {
    _id: "sample_node_2",
    name: "Sample Node 2", 
    type: "input",
    description: "A sample input node"
  }
]);

print('Database initialized successfully');
