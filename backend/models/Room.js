const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["public", "protected"], required: true },
  secretKey: { type: String, default: null },
  messages: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Room", RoomSchema);
