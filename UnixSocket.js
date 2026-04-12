// Mongoose Model: UnixSocket
// Collection: unix_sockets in MongoDB
// Tracks Unix socket connections for fast failure detection

const mongoose = require('mongoose');

const UnixSocketSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    unique: true,
  },
  connectedService: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'connected',
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now,
  },
  failureCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  collection: 'unix_sockets',
});

const UnixSocket = mongoose.model('UnixSocket', UnixSocketSchema);

module.exports = UnixSocket;
