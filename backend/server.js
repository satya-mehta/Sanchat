// backend/server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Room = require('./models/Room');

const socketToUsername = {};

const allowedOrigins = [
  "https://sanchat.onrender.com",  //  prod front-end
  "http://127.0.0.1:5500",          //  local dev front-end
  "https://t0bpszzs-5500.inc1.devtunnels.ms" //port forwarding
];

const activeUsers = {};
const deleteTimers = {};

// Import tempRooms router AND its in-memory `rooms` store
const tempRoomRouter = require("./routes/tempRooms");

const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────
// Allow same-origin requests (your front end is on the same domain)
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET","POST"],
  credentials: true
}));
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
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET","POST"],
    credentials: true
  }
}); // CORS which allows same + allowed origin

// ─── SOCKET.IO EVENTS ─────────────────────────────────
io.on("connection", socket => {
  console.log("🟢 Socket connected:", socket.id);

  // 1️⃣ Check if room exists and whether it is protected
  socket.on("check-room", async roomCode => {
    const room = await Room.findOne({ code: roomCode });

    if (!room) {
      socket.emit("room-check-result", { exists: false });
      return;
    }

    socket.emit("room-check-result", {
      exists: true,
      requiresSecret: Boolean(room.secretKey),
      roomName: room.code
    });
  });

  // 2️⃣ Verify a submitted secret
  socket.on("submit-secret", async ({ roomCode, secret }) => {
    const room = await Room.findOne({ code: roomCode });
    const success = room && room.secretKey === secret;
    socket.emit("secret-result", { success });
  });

  // 3️⃣ Join the room
  socket.on("join-room", async ({roomCode, username}) => {
    const room = await Room.findOne({ code: roomCode });

    if (!room) {
      socket.emit("joined-room-success", { error: "Room no longer exists." });
      return;
      }

    socket.join(roomCode);
    console.log(`➡️ ${username} (Socket ${socket.id}) joined room ${roomCode}`);
    socket.emit("joined-room-success", { roomCode });

    socketToUsername[socket.id] = username;

    // Cancel deletion if it's scheduled
    if (deleteTimers[roomCode]) {
      clearTimeout(deleteTimers[roomCode]);
      delete deleteTimers[roomCode];
    }

    // Track active users
    if (!activeUsers[roomCode]) activeUsers[roomCode] = new Set();
    activeUsers[roomCode].add(socket.id);

    // Update last activity
    await Room.updateOne({ code: roomCode }, { lastActive: new Date() });
  });

  // 4️⃣ Send message to other room members
  socket.on("sendMessage", async ({ roomCode, message }) => {
    // Relay the message
    socket.to(roomCode).emit("receiveMessage", message);
  });

  socket.on("heartbeat-reply", (roomCode) => {
    if(!activeUsers[roomCode]) activeUsers[roomCode] = new Set();
    activeUsers[roomCode].add(socket.id);
  });

  // 5️⃣ Handle user disconnecting from room
  socket.on("disconnecting", () => {
    for (const roomCode of socket.rooms) {
      if (activeUsers[roomCode]) {
        activeUsers[roomCode].delete(socket.id);

        // If no users left, schedule deletion
        if (activeUsers[roomCode].size === 0) {
          console.log(`🕒 Room ${roomCode} empty — will delete after 60 minutes.`);
          deleteTimers[roomCode] = setTimeout(async () => {
            await Room.deleteOne({ code: roomCode });
            delete activeUsers[roomCode];
            delete deleteTimers[roomCode];
            console.log(`🗑️ Room ${roomCode} deleted after 60 min of inactivity.`);
          }, 60 * 60 * 1000); // 60 minutes
        }
      }
    }
  });

  // 6️⃣ Clean-up logging
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    delete socketToUsername[socket.id];
  });
});

//------------heartbeat ping logic-----------

// After heartbeat, wait 2 seconds to collect replies and reset
// Emit heartbeat every 10 sec
setInterval(() => {
  io.sockets.emit("heartbeat");
}, 10000);

// Cleanup and reset after 12 sec (2 sec after heartbeat)
setInterval(() => {
  for (const roomCode in activeUsers) {
    const socketIds = [...activeUsers[roomCode]];
    const usernames = socketIds.map(id => socketToUsername[id]).filter(Boolean);

    io.to(roomCode).emit("active-users", {
      roomCode,
      activeUsernames: usernames,
    });

    if (socketIds.length === 0) {
      console.log(`⚠️ Room ${roomCode} had no heartbeat replies.`);

      if (!deleteTimers[roomCode]) {
        deleteTimers[roomCode] = setTimeout(async () => {
          await Room.deleteOne({ code: roomCode });
          delete activeUsers[roomCode];
          delete deleteTimers[roomCode];
          console.log(`🗑️ Room ${roomCode} deleted after heartbeat inactivity.`);
        }, 60 * 60 * 1000);
      }
    } else {
      if (deleteTimers[roomCode]) {
        clearTimeout(deleteTimers[roomCode]);
        delete deleteTimers[roomCode];
      }
    }

    // Reset for next round
    activeUsers[roomCode] = new Set();
  }
}, 12000);


// ─── START THE SERVER ──────────────────────────────────
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
