const express = require("express");
const router = express.Router();

const multer = require("multer");

const { test, getPDF, downloadSheet } = require("../components/googleSheets");

router.get("/qustions", async (req, res) => {
  try {
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/pdf", async (req, res) => {
  try {
    await getPDF("ds", "ds");
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/download", async (req, res) => {
  try {
    await downloadSheet("ds");
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
