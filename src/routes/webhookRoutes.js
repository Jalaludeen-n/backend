const express = require("express");
const router = express.Router();
const axios = require("axios");
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;
const notificationUrl = process.env.NOTIFICATION_URL;

router.get("/create-webhook", async (req, res) => {
  try {
    const webhookConfig = {
      notificationUrl: `${notificationUrl}`, // Replace with your backend webhook URL
      specification: {
        options: {
          filters: {
            dataTypes: ["tableData"], // Trigger on changes to record data
            recordChangeScope: "tblIDHrce5wFKeOya", // Replace with your Airtable table ID
            watchDataInFieldIds: [
              "fldg4q0xq2QsofmHf",
              "fldRzre0LCkn53U3f",
              "fldo6NqQFxe3QsAGT",
            ], // Replace with your EmailID field ID
          },
          includes: {
            includeCellValuesInFieldIds: "all", // Include cell values in this field
            includePreviousCellValues: true,
            includePreviousFieldDefinitions: true,
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
    console.error("Error creating webhook:", error.response);
    res.status(500).json({ error: "Error creating webhook" });
  }
});

router.get("/list", async (req, res) => {
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
    console.error("Error listing webhooks:", error);
    res.status(500).json({ error: "Error listing webhooks" });
  }
});

router.delete("/delete-webhook", async (req, res) => {
  const webhookId = req.body.data.webhookId;

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
