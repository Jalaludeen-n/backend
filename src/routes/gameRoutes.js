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
  storeParticipant,
  fetchParticipantDetails,
} = require("../components/airtable");

const { fetchGameData } = require("../controller/airtable");
const { getRole } = require("../components/gameDetails");

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
    const result = await joinGame(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/running", async (req, res) => {
  try {
    const data = await getRunningAndPastGame();
    await res
      .status(200)
      .json({ data: data.fields, message: "fetched successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/details", async (req, res) => {
  try {
    const data = await fetchParticipantDetails(req.body);
    // const role = await getRole(req.body);
    // await storeParticipant(req.body, data);

    // const pdfFilePath = path.join(__dirname, "./../uploads", "individualPdf.pdf"); // Adjust the path as needed

    // Read the PDF file and send along with game details
    // fs.readFile(pdfFilePath, (err, pdfData) => {
    //   if (err) {
    //     console.error("Error reading PDF file:", err);
    //     return res.status(500).send("Error reading PDF file");
    //   }
    //   const base64Pdf = Buffer.from(pdfData).toString("base64");
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
