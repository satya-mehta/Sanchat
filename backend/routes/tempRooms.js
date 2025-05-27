// routes/tempRooms.js
const express = require("express");
const router = express.Router();
const Room = require("../models/Room"); // MongoDB Room model

// Utility to generate a 6-char room code
function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create Room
router.post("/create", async (req, res) => {
  try{
  console.log("⚡️ Received create-room request:", req.body);
  const { roomType, secretKey } = req.body;

  let roomCode;
  let isUnique = false;

  // Generate unique room code
  while (!isUnique) {
    roomCode = generateRoomCode();
    const existing = await Room.findOne({ code: roomCode });
    if (!existing) isUnique = true;
  }

  const newRoom = new Room({
    code: roomCode,
    type: roomType,
    secretKey: roomType === "protected" ? secretKey : null,
    messages: [],
    createdAt: new Date(),
    lastActive: new Date()
  });

  await newRoom.save();

  console.log("✅ Created room with code:", roomCode);
  return res.json({ roomCode });
}catch(err){
  console.error("X Error in /api/temp/create:", err);
  return res.status(500).json({error: "Internal server error"});
}
});

// Join Room
router.post("/join", async (req, res) => {
  const { roomCode, secretKey } = req.body;

  const room = await Room.findOne({ code: roomCode });

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  if (room.type === "protected" && room.secretKey !== secretKey) {
    return res.status(403).json({ error: "Invalid secret key" });
  }

  res.json({ success: true, roomCode });
});

module.exports = router;
