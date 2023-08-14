const WebSocket = require("ws");

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (socket) => {
    console.log("WebSocket connected");

    socket.on("message", (message) => {
      console.log("Received:", message);

      socket.send("Message received by server");
    });

    socket.on("close", () => {
      console.log("WebSocket disconnected");
    });
  });

  return wss;
};
