const express = require("express");
const router = express.Router();

const {
  getLevelStatus,
  startLevel,
  getRoundPdf,
  updateRound,
  getCurrentLevelStatus,
} = require("../components/level");

router.post("/start", async (req, res) => {
  try {
    startLevel(JSON.parse(req.body.data));
    res.status(200).json({ message: "Game Started successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/status", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getLevelStatus(queryData);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/current-status", async (req, res) => {
  try {
    const queryData = req.query;
    const { roomNumber, gameId, level } = queryData;

    const data = await getCurrentLevelStatus(roomNumber, gameId, level);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.patch("/update", async (req, res) => {
  try {
    const data = await updateRound(JSON.parse(req.body.data));
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/pdf", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getRoundPdf(queryData);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
