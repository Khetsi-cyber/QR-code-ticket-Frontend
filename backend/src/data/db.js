const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Try to use better-sqlite3 (fast, synchronous). If it's not available
// (native build failed in this environment), fall back to the in-memory
// store implementation so the server can run.
try {
  const Database = require('better-sqlite3');

  const DB_DIR = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const DB_FILE = path.join(DB_DIR, 'db.sqlite');

  const db = new Database(DB_FILE);

  // Initialize tables
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    role TEXT,
    passwordHash TEXT
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    ownerEmail TEXT,
    status TEXT,
    issuedAt TEXT,
    scannedAt TEXT
  );
  `);

  // Seed users if not present
  const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const insertUser = db.prepare('INSERT INTO users (id, email, username, role, passwordHash) VALUES (?, ?, ?, ?, ?)');

  function seedUserIfMissing(email, username, role, plainPassword) {
    const exists = getUserByEmail.get(email);
    if (!exists) {
      const id = uuidv4();
      const hash = bcrypt.hashSync(plainPassword, 8);
      insertUser.run(id, email, username, role, hash);
    }
  }

  seedUserIfMissing('admin@example.com', 'admin', 'admin', 'AdminPass1');
  seedUserIfMissing('user@example.com', 'user', 'user', 'UserPass1');

  // Helpers
  const findUserByEmailOrUsernameStmt = db.prepare('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1');
  const insertTicketStmt = db.prepare('INSERT INTO tickets (id, ownerEmail, status, issuedAt) VALUES (?, ?, ?, ?)');
  const listTicketsStmt = db.prepare('SELECT * FROM tickets ORDER BY issuedAt DESC');
  const findTicketStmt = db.prepare('SELECT * FROM tickets WHERE id = ? LIMIT 1');

  module.exports = {
    findUserByEmailOrUsername: (identifier) => {
      if (!identifier) return null;
      return findUserByEmailOrUsernameStmt.get(identifier, identifier);
    },
    addTicket: (ticket) => {
      const id = ticket.id || uuidv4();
      const issuedAt = ticket.issuedAt || new Date().toISOString();
      insertTicketStmt.run(id, ticket.ownerEmail, ticket.status || 'active', issuedAt);
      return { id, ownerEmail: ticket.ownerEmail, status: ticket.status || 'active', issuedAt };
    },
    listTickets: () => {
      return listTicketsStmt.all();
    },
    findTicket: (id) => {
      return findTicketStmt.get(id);
    },
    markTicketUsed: (id) => {
      const scannedAt = new Date().toISOString();
      const stmt = db.prepare('UPDATE tickets SET status = ?, scannedAt = ? WHERE id = ?');
      stmt.run('used', scannedAt, id);
      return findTicketStmt.get(id);
    }
  };

} catch (err) {
  // Native better-sqlite3 not available — fall back to in-memory store.
  // This keeps the backend running in environments where native modules
  // cannot be built (like some containerized dev containers).
  console.warn('better-sqlite3 not available; falling back to in-memory store.\n', err && err.message);
  module.exports = require('./store');
}
