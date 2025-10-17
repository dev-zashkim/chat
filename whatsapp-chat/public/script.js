const socket = io();

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const usernameInput = document.getElementById("username");
const joinBtn = document.getElementById("join");
const userList = document.getElementById("user-list");

let username = null;

joinBtn.addEventListener("click", () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Enter a name!");
  username = name;
  socket.emit("join", username);
  usernameInput.disabled = true;
  joinBtn.disabled = true;
});

sendBtn.addEventListener("click", sendMessage);

function sendMessage() {
  const msg = input.value.trim();
  if (msg && username) {
    socket.emit("sendMessage", { user: username, message: msg });
    input.value = "";
  }
}

socket.on("receiveMessage", (data) => {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(data.user === username ? "self" : "other");
  div.innerHTML = `<strong>${data.user}:</strong> ${data.message}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on("userList", (users) => {
  userList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u;
    userList.appendChild(li);
  });
});
