// 1. Firebase Configuration
// Firebaseプロジェクト設定時に表示された `firebaseConfig` の値をここに貼り付けてください。
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkMLtoQ-xdrSXJ0yPriireWlOkO0O5zzg",
  authDomain: "abc-storage-chat.firebaseapp.com",
  projectId: "abc-storage-chat",
  storageBucket: "abc-storage-chat.firebasestorage.app",
  messagingSenderId: "157302310385",
  appId: "1:157302310385:web:8d32689a80979f1b7a7050",
  measurementId: "G-R1KCCV2185"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const messagesRef = database.ref('messages'); // データベース内の 'messages' という場所にデータを保存

// 3. DOM Elements
const chatBox = document.getElementById('chat-box');
const nameInput = document.getElementById('name-input');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
document.getElementById("send-button").addEventListener("click", sendMessage);

function sendMessage() {
    const name = document.getElementById("name-input").value;
    const message = document.getElementById("message-input").value;

    // メッセージが空でないことを確認
    if (name && message) {
        // Firebase Realtime Databaseにデータを送信
        const db = firebase.database();
        db.ref("messages").push({
            name: name,
            message: message,
            timestamp: Date.now()
        }).then(() => {
            // メッセージ送信後に入力フィールドをクリア
            document.getElementById("message-input").value = "";
        }).catch((error) => {
            console.error("Error sending message: ", error);
        });
    } else {
        alert("名前とメッセージを入力してください");
    }
}


// 5. Listen for new messages and display them
// 'child_added' イベントは、新しい子要素が 'messages' に追加されるたびに発火します
messagesRef.orderByChild('timestamp').on('child_added', (snapshot) => {
    const msg = snapshot.val();
    displayMessage(
        msg.name,
        msg.text,
        msg.timestamp,
        snapshot.key,        // ← メッセージキー（削除に必要）
        msg.senderId || "",  // ← 送信者ID（ボタン表示条件に必要）
        msg.vetoCount || 0   // ← 拒否カウント
    );
});


// (オプション) 既存メッセージの読み込み数を制限する場合 (例: 最新20件)
// messagesRef.orderByChild('timestamp').limitToLast(20).on('child_added', (snapshot) => {
//     const message = snapshot.val();
//     displayMessage(message.name, message.text, message.timestamp);
// });


// 6. Display Message Function
function displayMessage(name, text, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.textContent = name;

    const textSpan = document.createElement('span');
    textSpan.classList.add('text');
    textSpan.textContent = text;

    // (オプション) タイムスタンプを表示する場合
     const timeSpan = document.createElement('span');
     timeSpan.classList.add('timestamp');
     timeSpan.style.fontSize = '0.8em';
     timeSpan.style.color = '#777';
     timeSpan.style.marginLeft = '10px';
     timeSpan.textContent = `(${new Date(timestamp).toLocaleTimeString()})`;
    
    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(textSpan);
    // messageDiv.appendChild(timeSpan); // タイムスタンプ表示を有効にする場合

    chatBox.appendChild(messageDiv);

    // 自動で一番下にスクロール
    chatBox.scrollTop = chatBox.scrollHeight;
}
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter で改行、Enterのみで送信
        event.preventDefault(); // デフォルトのEnterキーの動作（改行など）を防ぐ
        sendMessage();
    }
});
const today = new Date().toISOString().split("T")[0];

// 初期化時：古いメッセージを削除
messagesRef.once("value", snapshot => {
    snapshot.forEach(child => {
        const message = child.val();
        const messageDate = new Date(message.timestamp).toISOString().split("T")[0];
        if (messageDate !== today) {
            messagesRef.child(child.key).remove();
        }
    });
});
// ユーザーIDを生成・保存
let userId = localStorage.getItem("chat_user_id");
if (!userId) {
    userId = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("chat_user_id", userId);
}

// 送信時にsenderIdを含める
messagesRef.push({
    name: name,
    text: message,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    senderId: userId,
    vetoCount: 0
});
function displayMessage(name, text, timestamp, key, senderId, vetoCount) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.textContent = name;

    const textSpan = document.createElement('span');
    textSpan.classList.add('text');
    textSpan.textContent = text;
    if (vetoCount >= 3) {
        textSpan.style.textDecoration = "line-through";
    }

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('timestamp');
    timeSpan.textContent = new Date(timestamp).toLocaleTimeString();

    messageDiv.appendChild(senderSpan);
    messageDiv.appendChild(textSpan);
    messageDiv.appendChild(timeSpan);

    // ✅ 削除ボタン（送信者のみ）
    if (senderId === userId) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "削除";
        deleteBtn.onclick = () => {
            messagesRef.child(key).remove();
        };
        messageDiv.appendChild(deleteBtn);
    }

    // ✅ 拒否ボタン（全員表示可能）
    const vetoBtn = document.createElement('button');
    vetoBtn.textContent = "拒否権";
    vetoBtn.onclick = () => {
        messagesRef.child(key).transaction(msg => {
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


// 初期フォーカス
nameInput.focus();