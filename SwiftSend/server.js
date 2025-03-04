const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors"); 
const os = require("os");

const app = express();
const server = http.createServer(app);

// Allow CORS for all local clients
const allowedOrigins = ["http://localhost:3000", `http://${getLocalIP()}:3000`];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  })
);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket"], // Force WebSocket connections for stability
});

app.get("/", (req, res) => {
  res.send("Welcome to the SwiftSend Signaling Server");
});

const peers = {}; // Store connected peers

io.on("connection", (socket) => {
  console.log(`🔗 New client connected: ${socket.id}`);

  // Assign Peer ID and send it to the client
  peers[socket.id] = socket.id;
  socket.emit("peer-id", socket.id);
  console.log(`✅ Assigned Peer ID: ${socket.id}`);

  // Handle WebRTC signaling messages
  socket.on("signal", ({ signal, target }) => {
    console.log(`📡 Signal received from ${socket.id} for target ${target}`);
    if (peers[target]) {
      io.to(target).emit("signal", { signal, from: socket.id });
      console.log(`✅ Forwarded signal to ${target}`);
    } else {
      console.error(`❌ Target peer ${target} not found or disconnected.`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    delete peers[socket.id]; 
  });

  // Handle socket errors
  socket.on("error", (err) => {
    console.error(`⚠️ Error on socket ${socket.id}:`, err);
  });
});

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Signaling server is running at:`);
  console.log(`   ➤ Local:   http://localhost:${PORT}`);
  console.log(`   ➤ Network: http://${getLocalIP()}:${PORT}`);
});

// Function to get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const key in interfaces) {
    for (const iface of interfaces[key]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; 
}
