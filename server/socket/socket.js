import { Server } from "socket.io";

export const initializeSockets = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  console.log("✅ Socket.IO Initialized");

  io.on("connection", (socket) => {
    console.log(`🟢 Socket Connected: ${socket.id}`);
   
    // Handle Custom Events
    socket.on("message", (data) => {
        console.log(`Message Received: ${data}`);
    });

    socket.on("custom-event", (data) => {
      console.log(`Custom Event Received: ${data}`);
    });




    // Handle Disconnection
    socket.on("disconnect", () => {
      console.log(`🔴 Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
};
