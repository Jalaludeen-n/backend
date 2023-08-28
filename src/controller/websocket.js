const socketIO = require("socket.io");

function createWebSocketServer(server) {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Emit a welcome message to the connected client
    socket.emit("message", "Welcome to the WebSocket server!");

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
}

module.exports = { createWebSocketServer };
