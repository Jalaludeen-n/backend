const express = require("express");
const router = express.Router();
const axios = require("axios");
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;

router.get("/create-webhook", async (req, res) => {
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

router.get("/list-webhook", async (req, res) => {
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

router.post("/webhook", (req, res) => {
  console.log("Received webhook:", req.body);

  const webhookData = req.body;
  wss.clients.forEach((client) => {
    client.send(JSON.stringify(webhookData));
  });

  res.status(200).end();
});

router.delete("/delete-webhook", async (req, res) => {
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

module.exports = router;
