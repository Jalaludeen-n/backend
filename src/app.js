// app.js

// Load environment variables from .env file
require("dotenv").config({ path: __dirname + "/.env" });
const axios = require("axios");
const createWebSocketServer = require("./controller/websocket"); // Update the path accordingly
const http = require("http");
// Airtable API Key and Base ID
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;
const socketIO = require("socket.io"); // Import the socket.io library
// Endpoint for creating webhooks
const webhookEndpoint = `https://api.airtable.com/v0/${baseId}/webhooks`;

// Import required modules
const express = require("express");
const cors = require("cors");
const {
  createGame,
  fetchGameData,
  startGame,
  joinGame,
} = require("./api/AirtableAPI");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create the Express app
const app = express();
const wss = createWebSocketServer(app);

// Use CORS middleware to handle cross-origin issues
app.use(cors());

// Parse JSON data from requests
app.use(express.json());

// Define routes
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // Without the trailing slash
    methods: ["GET", "POST"],
  },
});

// Create a socket.io server by passing the HTTP server instance

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Emit data to the connected client(s)
  socket.emit("message", "Hello from the server!");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

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

app.post("/join-game", async (req, res) => {
  try {
    joinGame(JSON.parse(req.body.data));
    res.status(200).json({ message: "Game Started successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/get-game-details", (req, res) => {
  // Replace this with your logic to fetch game details and PDF file
  const gameDetails = {
    gameId: "LL52WLU",
    roomNumber: "8X2GWLPP",
    // ... other game details
  };
  const pdfFilePath = path.join(__dirname, "./../uploads", "individualPdf.pdf"); // Adjust the path as needed

  // Read the PDF file and send along with game details
  fs.readFile(pdfFilePath, (err, pdfData) => {
    if (err) {
      console.error("Error reading PDF file:", err);
      return res.status(500).send("Error reading PDF file");
    }
    const base64Pdf = Buffer.from(pdfData).toString("base64");
    res.json({ gameDetails, base64Pdf });
  });
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

app.get("/qustions", async (req, res) => {
  try {
    const data = await fetchQustions();
    res.status(200).json({ data: data, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/create-webhook", async (req, res) => {
  try {
    const webhookConfig = {
      notificationUrl: "https://86ba-117-242-214-26.ngrok-free.app/webhook", // Replace with your backend webhook URL
      specification: {
        options: {
          filters: {
            fromSources: ["client"], // Listen for changes made by users through clients
            dataTypes: ["tableData"], // Trigger on changes to record data
            recordChangeScope: "tblEiKJnDm1kAOcAA", // Replace with your Airtable table ID
            watchDataInFieldIds: ["fldeGjAOvdSJZHfey"], // Replace with your EmailID field ID
          },
          includes: {
            includeCellValuesInFieldIds: ["fldeGjAOvdSJZHfey"], // Include cell values in this field
          },
        },
      },
    };

    const response = await axios.post(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks`,
      webhookConfig,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Webhook created:", response.data);
    res.status(200).json({ message: "Webhook created successfully" });
  } catch (error) {
    console.error("Error creating webhook:", error.response.data);
    res.status(500).json({ error: "Error creating webhook" });
  }
});

app.get("/list-webhook", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    console.log("Webhooks listed:", response.data);
    res.status(200).json({
      message: "Webhooks listed successfully",
      webhooks: response.data.records,
    });
  } catch (error) {
    console.error("Error listing webhooks:", error.response.data);
    res.status(500).json({ error: "Error listing webhooks" });
  }
});

app.post("/webhook", (req, res) => {
  console.log("Received webhook:", req.body);

  const webhookData = req.body;
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(webhookData));
  });

  res.status(200).end();
  // Handle the received data here (e.g., send a notification to the frontend)
  // ...
});

app.delete("/delete-webhook", async (req, res) => {
  const webhookId = "achk3nCIeJCfDJxN0"; // Replace with the ID of the webhook you want to delete

  try {
    const response = await axios.delete(
      `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Webhook deleted:", response.data);
    res.status(200).json({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("Error deleting webhook:", error.response.data);
    res.status(500).json({ error: "Error deleting webhook" });
  }
});

// Start the server
const port = 3001; // Replace with your desired port number
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
