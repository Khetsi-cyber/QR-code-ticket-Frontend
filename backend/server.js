require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// mount routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/tickets', require('./src/routes/tickets'));

app.get('/', (req, res) => res.json({ ok: true, msg: 'Bus Ticketing Backend' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
