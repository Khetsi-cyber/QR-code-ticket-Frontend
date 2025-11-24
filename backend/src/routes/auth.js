const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES = '2h';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, username, password, role, userRole } = req.body || {};
  const identifier = email || username;
  if (!identifier || !password) return res.status(400).json({ message: 'Missing credentials (email/username and password required)' });

  const user = db.findUserByEmailOrUsername(identifier);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  // optional role check
  const wanted = userRole || role;
  if (wanted && user.role !== wanted) return res.status(403).json({ message: 'Forbidden: role mismatch' });

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return res.json({ token, user: { id: user.id, username: user.username, role: user.role, email: user.email } });
});

module.exports = router;
