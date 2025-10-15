const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);

  // Send a welcome message
  ws.send(JSON.stringify({
    title: 'Welcome!',
    message: 'Connected to the notification server',
    type: 'success'
  }));

  // Handle messages from clients
  ws.on('message', (message) => {
    console.log('Received:', message);
    // Broadcast to all clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start the server
const PORT = process.env.WS_PORT || 8081;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

// Function to broadcast a notification to all connected clients
function broadcastNotification(notification) {
  const message = JSON.stringify({
    ...notification,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Export the broadcast function for use in other files
module.exports = { broadcastNotification };

// Start admin event simulation in development
if (process.env.NODE_ENV !== 'production') {
  const { simulateAdminEvents } = require('./adminEvents');
  simulateAdminEvents();
}
