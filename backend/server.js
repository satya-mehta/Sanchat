// backend/server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// Import your tempRooms router AND its in-memory `rooms` store
const { router: tempRoomRouter, rooms } = require("./routes/tempRooms");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────
// Allow same-origin requests (your front end is on the same domain)
app.use(cors());
app.use(express.json());

// ─── ROUTES ────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/temp", tempRoomRouter);

// ─── MONGODB CONNECTION ─────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ─── HTTP + SOCKET.IO SETUP ────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer); // default CORS allows same origin

// ─── SOCKET.IO EVENTS ─────────────────────────────────
io.on("connection", socket => {
  console.log("🟢 Socket connected:", socket.id);

  // 1) Check if room exists & whether it’s protected
  socket.on("check-room", roomCode => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("room-check-result", { exists: false });
    } else {
      socket.emit("room-check-result", {
        exists: true,
        requiresSecret: Boolean(room.secretKey),
        roomName: roomCode
      });
    }
  });

  // 2) Verify a submitted secret
  socket.on("submit-secret", ({ roomCode, secret }) => {
    const room = rooms[roomCode];
    const success = room && room.secretKey === secret;
    socket.emit("secret-result", { success });
  });

  // 3) Actually join the room
  socket.on("join-room", roomCode => {
    if (rooms[roomCode]) {
      socket.join(roomCode);
      console.log(`➡️ Socket ${socket.id} joined room ${roomCode}`);
      socket.emit("joined-room-success", { roomCode });
    } else {
      socket.emit("joined-room-success", { error: "Room no longer exists." });
    }
  });

  // 4) Relay chat messages to everyone else in the room
  socket.on("sendMessage", ({ roomCode, message }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].messages.push(message);
      socket.to(roomCode).emit("receiveMessage", message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ─── START THE SERVER ──────────────────────────────────
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
