const path = require("path");
const User = require(path.resolve(__dirname, "../models/user"));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "sanchat_secret";

exports.signup = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Signup successful", token, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", token, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
