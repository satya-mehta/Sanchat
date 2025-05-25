const express = require("express");
const router = express.Router();
const {login, signup} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.get("/", (req, res) => {
  res.send("Auth API is live!");
});

module.exports = router;