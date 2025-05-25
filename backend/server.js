// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const tempRoomRoutes = require("./routes/tempRooms");
app.use("/api/temp", tempRoomRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch((err) => console.error("MongoDB connection error:", err));


//-----------------------temporary-chat-handling-------

fetch("/api/temp/create", { //create room
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ roomType: "protected", secretKey: "mysecret" })
})
  .then((res) => res.json())
  .then((data) => console.log("Room code:", data.roomCode));


fetch("/api/temp/join", { //join room
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ roomCode: "ABC123", secretKey: "mysecret" })
})
  .then((res) => res.json())
  .then((data) => console.log("Joined:", data));

// ------------------ 🔴 Socket.IO Integration ------------------
// You only need this AFTER `app.listen()` is called
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

const io = socketio(server, {
  cors: {
    origin: "*", // Or restrict to your frontend
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", ({ roomCode }) => {
    socket.join(roomCode);
    console.log(`Joined room: ${roomCode}`);
  });

  socket.on("sendMessage", ({ roomCode, message }) => {
    if (!rooms[roomCode]) rooms[roomCode] = { messages: [] };
    rooms[roomCode].messages.push(message);

    socket.to(roomCode).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
