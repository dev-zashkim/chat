const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (username) => {
    users[socket.id] = username;
    io.emit("userList", Object.values(users));
    console.log(`${username} joined the chat`);
  });

  socket.on("sendMessage", (data) => {
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", users[socket.id]);
    delete users[socket.id];
    io.emit("userList", Object.values(users));
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`💬 Server running on http://localhost:${PORT}`));
