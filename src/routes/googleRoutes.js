const express = require("express");
const router = express.Router();

router.get("/qustions", async (req, res) => {
  try {
    res.status(200).json({ data: data, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
