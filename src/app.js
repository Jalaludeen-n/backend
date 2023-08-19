require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const http = require("http");
const gameRoutes = require("./routes/gameRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const google = require("./routes/googleRoutes");
const { createWebSocketServer } = require("./controller/websocket");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/game", gameRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/google", google);

createWebSocketServer(server);

const port = 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
