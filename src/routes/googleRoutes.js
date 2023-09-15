const express = require("express");
const router = express.Router();

const { getPDF } = require("../components/googleSheets");
const { deleteAllFiles } = require("../controller/google");

router.get("/qustions", async (req, res) => {
  try {
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/download", async (req, res) => {
  try {
    await getPDF("test", "test");
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
router.get("/deleteAll", async (req, res) => {
  try {
    await deleteAllFiles();
    res.status(200).json({ data: {}, message: "data fetched successully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
