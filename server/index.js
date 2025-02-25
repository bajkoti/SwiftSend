
import process from "process";

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 5000;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Relay signaling data to the peer
  socket.on("signal", (data) => {
    const { target, payload } = data;
    if (target) {
      io.to(target).emit("signal", { from: socket.id, payload });
    }
  });

  // Notify peers when a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
