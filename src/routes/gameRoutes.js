const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createGame,
  startGame,
  joinGame,
  getRunningAndPastGame,
  getRoles,
  fetchParticipantDetails,
  fetchGroupDetails,
  fetchParticipants,
  selectRole,
  fetchLevelDetails,
  storeAnsweres,
} = require("../components/airtable");

const { fetchGameData } = require("../controller/airtable");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/new", upload.array("pdf"), async (req, res) => {
  try {
    createGame(req.files, req.body.data, req.body.roles);
    res.status(200).json({ message: "Game saved successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/start", async (req, res) => {
  try {
    console.log(req.body.data);
    startGame(JSON.parse(req.body.data));
    res.status(200).json({ message: "Game Started successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const result = await joinGame(JSON.parse(req.body.data));
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/running", async (req, res) => {
  try {
    const data = await getRunningAndPastGame();
    await res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/details", async (req, res) => {
  try {
    const parsedValue = JSON.parse(req.body.data);
    const data = await fetchParticipantDetails(parsedValue);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/answeres", async (req, res) => {
  try {
    const parsedValue = JSON.parse(req.body.data);
    const data = await storeAnsweres(parsedValue);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/level", async (req, res) => {
  try {
    const parsedValue = JSON.parse(req.body.data);
    const data = await fetchLevelDetails(parsedValue);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.post("/players", async (req, res) => {
  try {
    const parsedValue = JSON.parse(req.body.data);
    const data = await fetchParticipants(parsedValue);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.post("/groups", async (req, res) => {
  try {
    const parsedValue = JSON.parse(req.body.data);
    const data = await fetchGroupDetails(parsedValue);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/roles", async (req, res) => {
  try {
    const data = await getRoles(req.body.data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/select-role", async (req, res) => {
  try {
    const data = await selectRole(JSON.parse(req.body.data));
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/list", async (req, res) => {
  try {
    const fields = ["GameID", "GameName", "Date"];
    const data = await fetchGameData("Games", fields);
    res.status(200).json({ data: data, message: "Game list" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
