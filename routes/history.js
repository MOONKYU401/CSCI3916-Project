const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// inline token verification
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

router.get("/", async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: "Invalid or missing token" });

  const user = await User.findById(payload.id);
  res.json(user.history || []);
});

router.post("/", async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: "Invalid or missing token" });

  const { city } = req.body;
  await User.findByIdAndUpdate(payload.id, {
    $addToSet: { history: city },
  });
  res.json({ message: "City added" });
});

module.exports = router;
