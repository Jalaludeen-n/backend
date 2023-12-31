require("dotenv").config({ path: __dirname + "/.env" });
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const gameRoutes = require("./routes/gameRoutes");
const levelRoutes = require("./routes/levelRoutes");
const roleRoutes = require("./routes/roleRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const google = require("./routes/googleRoutes");
const decision = require("./routes/decisionRoutes");
const origin = process.env.ORIGIN;
const socketIO = require("socket.io");
const {
  updateAllUserRounds,
  getIDs,
  isLevelUpdated,
  isRoleAdded,
  isNewUserAdded,
  findLastChangedRecord,
  fetchAndProcessPayloads,
} = require("./components/webhook");
const app = express();
const server = http.createServer(app);
const wss = socketIO(server, {
  cors: {
    origin: origin,
    methods: ["GET", "POST", "PATCH"],
  },
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

wss.on("connection", (ws) => {
  console.log("WebSocket connection established");

  // Handle WebSocket disconnection
  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

app.use("/game", gameRoutes);
app.use("/level", levelRoutes);
app.use("/role", roleRoutes);
app.use("/google", google);
app.use("/decision-form", decision);
app.use("/webhooks", webhookRoutes);
app.post("/webhook", async (req, res) => {
  try {
    console.log("Received webhook:");
    const webhookId = req.body.webhook.id;
    const webhookDetails = await fetchAndProcessPayloads(webhookId);
    if (webhookDetails.changedTablesById.tblV3jiz53Pnokoa4.changedRecordsById) {
      const lastChangedRecord = findLastChangedRecord(webhookDetails);
      const ids = getIDs(lastChangedRecord);
      if (ids) {
        const { GameID, RoomNumber, GroupName } = ids;
        if (isNewUserAdded(lastChangedRecord)) {
        } else if (isRoleAdded(lastChangedRecord)) {
          wss.sockets.emit("participants", "test");
        } else if (isLevelUpdated(lastChangedRecord)) {
          const level =
            lastChangedRecord.current.cellValuesByFieldId.fld1ghCkCQ5Oll7kg;
          await updateAllUserRounds(GameID, RoomNumber, GroupName, level);
          wss.sockets.emit("level", level);
        }
      } else {
        console.log("IDs not available");
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
  res.status(200).end();
});
app.post("/levelWebhook", async (req, res) => {
  try {
    wss.sockets.emit("start", "started");
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
  res.status(200).end();
});

const port = 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
