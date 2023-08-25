const express = require("express");
const router = express.Router();

const multer = require("multer");

const { test } = require("../components/googleSheets");

router.get("/qustions", async (req, res) => {
  try {
    test("work");
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
