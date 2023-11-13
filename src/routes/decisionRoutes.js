const express = require("express");
const { getQustions } = require( "../components/decision" );
const router = express.Router();


router.get("/questions", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getQustions(queryData);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});




module.exports = router;
