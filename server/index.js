const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/approvals', require('./routes/approvals'));
app.use('/api/agents', require('./routes/agents'));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const db = require('./db');
db.initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Cortex server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
