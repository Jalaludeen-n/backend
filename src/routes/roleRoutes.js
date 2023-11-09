const express = require("express");
const router = express.Router();

const { getRolePdf } = require("../components/role");

router.get("/pdf", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getRolePdf(queryData);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
