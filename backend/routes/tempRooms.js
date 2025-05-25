const express = require("express");
const router = express.Router();

const rooms = {}; // In-memory temporary room store

function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create room
router.post("/create", (req, res) => {
  console.log('⚡️ Received create-room request:', req.body);
  const { roomType, secretKey } = req.body;

  let roomCode;
  do {
    roomCode = generateRoomCode(6);
  } while (rooms[roomCode]);

  rooms[roomCode] = {
    type: roomType,
    secretKey: roomType === "protected" ? secretKey : null,
    createdAt: Date.now(),
    messages: []
  };

  console.log('⚡️ Sending back roomCode:', roomCode);
  res.json({ roomCode });
});

// Join room
router.post("/join", (req, res) => {
  const { roomCode, secretKey } = req.body;
  const room = rooms[roomCode];

  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.type === "protected" && room.secretKey !== secretKey)
    return res.status(403).json({ error: "Invalid secret key" });

  res.json({ success: true, roomCode });
});

module.exports = router;
