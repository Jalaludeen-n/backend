const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  createGame,
  startGame,
  getRunningAndPastGame,
  getRoles,
  fetchParticipantDetails,
  fetchGroupDetails,
  fetchParticipants,
  selectRole,
  gameCompleted,
  getScore,
  getMember,
  fetchGroupStatus,
} = require("../components/airtable");

const { joinGame } = require("./../components/airtable/joinGame");

const { fetchGameData } = require("../controller/airtable");
const { sendEmailWithPDF } = require("../components/mail/send");
const { test } = require("../components/decision");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/join", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const result = await joinGame(JSON.parse(req.body.data), req.wss);
    res.header("Content-Type", "application/json");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/mail", async (req, res) => {
  try {
    const data = sendEmailWithPDF("Jalaludeen.n@yahoo.com", "deen", "d");
    res.status(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/new", upload.array("pdf"), async (req, res) => {
  try {
    checkCreateGameParams(req, res);
    await createGame(req.files, req.body.data, req.body.roles);
    res.status(200).json({ message: "Game saved successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/test", async (req, res) => {
  try {
    await fetchGroupStatus();
    res.status(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/start", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    await startGame(JSON.parse(req.body.data));
    res.status(200).json({ message: "Game Started successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/running", async (req, res) => {
  try {
    const data = await getRunningAndPastGame();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/details", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const parsedValue = JSON.parse(req.body.data);
    const data = await fetchParticipantDetails(parsedValue);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/over", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const parsedValue = JSON.parse(req.body.data);
    const data = await gameCompleted(parsedValue);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.post("/players", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const parsedValue = JSON.parse(req.body.data);
    const data = await fetchParticipants(parsedValue);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/groups", async (req, res) => {
  try {
    const parsedValue = req.query;
    const data = await fetchGroupDetails(parsedValue);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/group-status", async (req, res) => {
  try {
    const parsedValue = req.query;
    const data = await fetchGroupDetails(parsedValue);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/roles", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getRoles(queryData);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/score", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const data = await getScore(JSON.parse(req.body.data));
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.post("/member", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const data = await getMember(JSON.parse(req.body.data));
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/select-role", async (req, res) => {
  try {
    checkRequestBodyAndDataField(req, res);
    const data = await selectRole(JSON.parse(req.body.data));
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/list", async (req, res) => {
  try {
    const fields = ["GameID", "GameName", "Date", "NumberOfRounds"];
    const data = await fetchGameData("Games", fields);
    if (data.length === 0) {
      return res.status(200).json({ message: "No active games" });
    }

    res.status(200).json({ data: data, message: "Game list" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const checkRequestBodyAndDataField = (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Request body is missing" });
  }

  const requestData = req.body.data;

  if (!requestData) {
    return res
      .status(400)
      .json({ error: "'data' field is missing in the request body" });
  }
};
const checkCreateGameParams = (req, res) => {
  if (!req.files) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  if (!req.body || !req.body.data) {
    return res
      .status(400)
      .json({ error: "'data' field is missing in the request body" });
  }

  if (!req.body.roles) {
    return res
      .status(400)
      .json({ error: "'roles' field is missing in the request body" });
  }
};

module.exports = router;
