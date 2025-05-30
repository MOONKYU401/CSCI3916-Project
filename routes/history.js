const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// Inline JWT auth
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

// GET: fetch city history
router.get("/", async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const user = await User.findById(payload.id);
  res.json(user.history || []);
});


// POST: add a city
router.post("/", async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "City required" });

  try {
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.history.includes(city)) {
      return res.status(409).json({ error: "City already saved" });
    }

    await User.findByIdAndUpdate(payload.id, {
      $addToSet: { history: city },
    });

    res.json({ message: "City saved" });
  } catch (err) {
    console.error("Error saving city:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// DELETE: remove a city
router.delete("/", async (req, res) => {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });

  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "City required" });

  await User.findByIdAndUpdate(payload.id, {
    $pull: { history: city },
  });
  res.json({ message: "City deleted" });
});

module.exports = router;
