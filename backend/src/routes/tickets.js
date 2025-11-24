const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const db = require('../data/db');

// Protected endpoints
router.use(auth);

// GET /api/tickets
router.get('/', (req, res) => {
  const list = db.listTickets();
  res.json(list);
});

// POST /api/tickets
router.post('/', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'email is required' });
  const ticket = db.addTicket({ ownerEmail: email });
  res.status(201).json(ticket);
});

// POST /api/tickets/verify
router.post('/verify', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ message: 'id is required' });
  const ticket = db.findTicket(id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ valid: ticket.status === 'active', ticket });
});

// POST /api/tickets/scan
router.post('/scan', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ message: 'id is required' });
  const ticket = db.findTicket(id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  const updated = db.markTicketUsed(id);
  res.json({ ok: true, ticket: updated });
});

module.exports = router;
