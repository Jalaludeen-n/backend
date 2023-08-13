// app.js

// Load environment variables from .env file
require("dotenv").config({ path: __dirname + "/.env" });

// Import required modules
const express = require("express");
const cors = require("cors");
const { createGame, fetchGameData, startGame } = require("./api/AirtableAPI");
const multer = require("multer");

// Set up multer storage for storing files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create the Express app
const app = express();

// Use CORS middleware to handle cross-origin issues
app.use(cors());

// Parse JSON data from requests
app.use(express.json());

// Define routes

// Route for creating a new game
app.post("/new-game", upload.array("pdf"), async (req, res) => {
  try {
    // Call createGame function with request data
    createGame(req.files, req.body.data, req.body.roles);
    res.status(200).json({ message: "Data and PDFs submitted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Route for starting a game
app.post("/start-game", async (req, res) => {
  try {
    // Call startGame function with request data
    startGame(JSON.parse(req.body.data));
    res.status(200).json({ message: "Game Started successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Route for fetching game data
app.get("/games", async (req, res) => {
  try {
    const data = await fetchGameData();
    res
      .status(200)
      .json({ data: data, message: "Data and PDFs submitted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Start the server
const port = 3001; // Replace with your desired port number
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
