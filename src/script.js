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
    const message = snapshot.val();
    displayMessage(message.name, message.text, message.timestamp);
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

// 初期フォーカス
nameInput.focus();