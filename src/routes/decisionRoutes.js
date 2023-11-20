const express = require("express");
const {
  getQustions,
  storeAnsweres,
  getResults,
  getResult,
} = require("../components/decision");
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
router.get("/results", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getResults(queryData);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/result", async (req, res) => {
  try {
    const queryData = req.query;
    const data = await getResult(queryData);
    res.header("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.post("/answeres", async (req, res) => {
  try {
    const parsedValue = JSON.parse(req.body.data);
    const data = await storeAnsweres(parsedValue, req.wss);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
