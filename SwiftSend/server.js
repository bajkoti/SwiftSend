const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Welcome to the SwiftSend Signaling Server");
});

const peers = {}; 

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  
  peers[socket.id] = socket.id;
  socket.emit("peer-id", socket.id);
  console.log(`Assigned Peer ID to client: ${socket.id}`);

  
  socket.on("signal", ({ signal, target }) => {
    console.log(`Signal received from ${socket.id} for target ${target}`);
    if (peers[target]) {
      console.log(`Forwarding signal to target ${target}`);
      io.to(target).emit("signal", { signal, from: socket.id });
    } else {
      console.error(`Target peer ${target} not found or disconnected.`);
    }
  });

  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    delete peers[socket.id]; 
  });

  
  socket.on("error", (err) => {
    console.error(`Error on socket ${socket.id}:`, err);
  });
});


const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Signaling server is running on http://localhost:${PORT}`);
});
