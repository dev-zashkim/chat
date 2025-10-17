// chat.js - shared frontend for group and admin
function initChat({ room, roomPrefix, domSelectors }) {
  // allow passing domSelectors or default ids
  const s = domSelectors || {};
  const $ = (sel) => document.querySelector(sel);

  const usernameInput = $(s.usernameInput || "#usernameInput");
  const enterBtn = $(s.enterBtn || "#enterBtn");
  const sendBtn = $(s.sendBtn || "#sendBtn");
  const msgInput = $(s.msgInput || "#msgInput");
  const messages = $(s.messages || "#messages");
  const yourName = $(s.yourName || "#yourName");
  const roomTitle = $(s.roomTitle || "#roomTitle");

  const socket = io();
  let currentRoom = room || null;
  let userId = null;
  let username = null;

  function appendSystem(text) {
    const el = document.createElement("div");
    el.className = "meta";
    el.style.opacity = "0.85";
    el.style.padding = "6px";
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendMessage({ username: u, message, time, me }) {
    const p = document.createElement("div");
    p.className = "msg " + (me ? "me" : "other");
    p.innerHTML = `<div style="font-size:13px; font-weight:700;">${u}</div>
                   <div style="margin-top:6px; line-height:1.3;">${escapeHtml(message)}</div>
                   <div class="meta" style="font-size:11px; margin-top:8px;">${new Date(time).toLocaleTimeString()}</div>`;
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  }

  function joinRoom(roomToJoin) {
    currentRoom = roomToJoin;
    userId = (Math.random() + 1).toString(36).substring(2, 9);
    username = usernameInput.value ? usernameInput.value.trim() : "Guest-" + userId;
    socket.emit("joinRoom", { room: currentRoom, userId, username });
    yourName.textContent = username;
    if (roomTitle) roomTitle.textContent = currentRoom === "global" ? "Global Chat" : "Private: " + currentRoom;
    appendSystem("You joined: " + currentRoom);
  }

  enterBtn.addEventListener("click", () => {
    if (!usernameInput.value.trim()) {
      alert("Please enter a display name first.");
      usernameInput.focus();
      return;
    }
    // If a roomPrefix exists (admin page), create a private room name
    if (roomPrefix) {
      const uid = (Math.random() + 1).toString(36).substring(2, 9);
      joinRoom(roomPrefix + uid);
      // show the private room id so user can share with admin if needed
      appendSystem("Your private room id: " + (roomPrefix + uid) + ". Share this with admin to connect.");
    } else {
      joinRoom(currentRoom || "global");
    }
  });

  sendBtn.addEventListener("click", () => {
    const text = msgInput.value.trim();
    if (!text) return;
    socket.emit("chatMessage", { room: currentRoom || "global", userId, username, message: text });
    appendMessage({ username, message: text, time: new Date().toISOString(), me: true });
    msgInput.value = "";
  });

  msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  // socket listeners
  socket.on("chatMessage", (data) => {
    // don't re-render messages we already appended as 'me' (but that's ok if duplicated)
    const isMe = data.userId === userId;
    appendMessage({ username: data.username, message: data.message, time: data.time, me: isMe });
  });

  socket.on("systemMessage", (data) => {
    appendSystem(data.message + " (" + new Date(data.time).toLocaleTimeString() + ")");
  });

  socket.on("privateMessage", (data) => {
    appendSystem(`Private from ${data.from}: ${data.message}`);
  });

  // initial default for group chat page
  if (!room && !roomPrefix) {
    // default to global but wait for user to press Enter to join (so they set name)
    currentRoom = "global";
  }
}
