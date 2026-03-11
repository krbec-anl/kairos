const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRouter = require('./routes/upload');
const dataRouter = require('./routes/data');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/upload', uploadRouter);
app.use('/api', dataRouter);

// Serve frontend in production
app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FOKUS LABE Dashboard API běží na portu ${PORT}`);
});
