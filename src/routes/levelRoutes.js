const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createGame,
  startGame,
  getRunningAndPastGame,
  getRoles,
  fetchParticipantDetails,
  getLevelStatus,
  startLevel,
  fetchGroupDetails,
  fetchParticipants,
  selectRole,
  fetchLevelDetails,
  storeAnsweres,
  gameCompleted,
  getScore,
  getMember,
  getRolePdf,
  getRoundPdf,
} = require("../components/airtable");

const { joinGame } = require("./../components/airtable/joinGame");

const { fetchGameData } = require("../controller/airtable");
const { sendEmailWithPDF } = require("../components/mail/send");

const storage = multer.memoryStorage();
const upload = multer({ storage });

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

router.patch("/update", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const data = await updateLevel(JSON.parse(req.body));
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/df", async (req, res) => {
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