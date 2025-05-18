
  // Firebase Config
  const firebaseConfig = {
    apiKey: "AIzaSyCkMLtoQ-xdrSXJ0yPriireWlOkO0O5zzg",
    authDomain: "abc-storage-chat.firebaseapp.com",
    projectId: "abc-storage-chat",
    storageBucket: "abc-storage-chat.firebasestorage.app",
    messagingSenderId: "157302310385",
    appId: "1:157302310385:web:8d32689a80979f1b7a7050",
    measurementId: "G-R1KCCV2185"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const messagesRef = database.ref("messages");

  const chatBox = document.getElementById("chat-box");
  const nameInput = document.getElementById("name-input");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");

  let userIp = null;

  // IPアドレス取得
  fetch("https://api.ipify.org?format=json")
    .then((res) => res.json())
    .then((data) => {
      userIp = data.ip;
      console.log("取得したユーザーIP:", userIp);
    });

  function sendMessage() {
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!userIp) {
      alert("IPアドレス取得中です。数秒後に再度お試しください。");
      return;
    }

    if (name === "" || message === "") {
      alert("名前とメッセージを入力してください");
      return;
    }

    messagesRef.push({
      name: name,
      text: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      ip: userIp,
      vetoCount: 0
    });

    messageInput.value = "";
    messageInput.focus();
  }

  function displayMessage(name, text, timestamp, key, senderIp, vetoCount) {
    console.log("表示中メッセージ:", { name, text, senderIp, currentUserIp: userIp });

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    const senderSpan = document.createElement("span");
    senderSpan.classList.add("sender");
    senderSpan.textContent = name;

    const textSpan = document.createElement("span");
    textSpan.classList.add("text");
    textSpan.textContent = text;
    if (vetoCount >= 3) {
      textSpan.style.textDecoration = "line-through";
    }

    const timeSpan = document.createElement("span");
    timeSpan.classList.add("timestamp");
    timeSpan.style.fontSize = "0.8em";
    timeSpan.style.color = "#777";
    timeSpan.style.marginLeft = "10px";
    timeSpan.textContent = `(${new Date(timestamp).toLocaleTimeString()})`;

    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(textSpan);
    messageDiv.appendChild(timeSpan);

    // 削除ボタン（IPが一致すれば表示）
    if (senderIp === userIp) {
      console.log("→ 削除ボタンを表示（IP一致）:", senderIp);
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "削除";
      deleteBtn.onclick = () => {
        messagesRef.child(key).remove();
      };
      messageDiv.appendChild(deleteBtn);
    } else {
      console.log("→ 削除ボタンを表示しない（IP不一致）:", { senderIp, userIp });
    }

    const vetoBtn = document.createElement("button");
    vetoBtn.textContent = "拒否権";
    vetoBtn.onclick = () => {
      messagesRef.child(key).transaction((msg) => {
        if (msg) {
          msg.vetoCount = (msg.vetoCount || 0) + 1;
        }
        return msg;
      });
    };
    messageDiv.appendChild(vetoBtn);

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  messagesRef.orderByChild("timestamp").on("child_added", (snapshot) => {
    const msg = snapshot.val();
    displayMessage(
      msg.name,
      msg.text,
      msg.timestamp,
      snapshot.key,
      msg.ip || "",
      msg.vetoCount || 0
    );
  });

  const today = new Date().toISOString().split("T")[0];
  messagesRef.once("value", (snapshot) => {
    snapshot.forEach((child) => {
      const message = child.val();
      if (!message.timestamp) return;
      const messageDate = new Date(message.timestamp).toISOString().split("T")[0];
      if (messageDate !== today) {
        messagesRef.child(child.key).remove();
      }
    });
  });

  nameInput.focus();
  // 9. 毎日12時に古いチャットを削除する処理
const now = new Date();
const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

// 前回削除日時をlocalStorageから取得
const lastClearedDate = localStorage.getItem("last_cleared_date");

if (lastClearedDate !== today && now.getHours() >= 12) {
    console.log("✔ 12時を過ぎていて、初回アクセスなのでデータを削除します");

    messagesRef.once("value", snapshot => {
        snapshot.forEach(child => {
            const message = child.val();
            if (!message.timestamp) return;
            const messageDate = new Date(message.timestamp).toISOString().split("T")[0];
            if (messageDate !== today) {
                console.log("🗑 古いメッセージ削除:", message.text);
                messagesRef.child(child.key).remove();
            }
        });

        // 最後に削除した日を記録
        localStorage.setItem("last_cleared_date", today);
    });
} else {
    console.log("🕒 削除不要: 前回削除日 = " + lastClearedDate);
}
