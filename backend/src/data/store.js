const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Seed users: admin and passenger
const users = [
  {
    id: uuidv4(),
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    passwordHash: bcrypt.hashSync('AdminPass1', 8),
  },
  {
    id: uuidv4(),
    email: 'user@example.com',
    username: 'user',
    role: 'user',
    passwordHash: bcrypt.hashSync('UserPass1', 8),
  }
];

const tickets = [
  // sample ticket
  { id: uuidv4(), ownerEmail: 'user@example.com', status: 'active', issuedAt: new Date().toISOString() }
];

module.exports = {
  users,
  tickets,
  findUserByEmailOrUsername: (identifier) => users.find(u => u.email === identifier || u.username === identifier),
  addTicket: (ticket) => { tickets.push(ticket); return ticket; },
  listTickets: () => tickets,
  findTicket: (id) => tickets.find(t => t.id === id),
};
