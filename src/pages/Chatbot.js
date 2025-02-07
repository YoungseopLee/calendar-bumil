import React, { useState } from "react";
import "./Chatbot.css";

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const handleInputChange = (event) => {
    setInputMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // 사용자 메시지를 채팅창에 추가
    setMessages([...messages, { text: inputMessage, sender: "user" }]);
    setInputMessage("");

    try {
      // Flask 서버에 API 요청 보내기
      const response = await fetch(`${process.env.REACT_APP_API_URL}/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        // Gemini API 응답을 채팅창에 추가
        setMessages([
          ...messages,
          { text: inputMessage, sender: "user" },
          { text: data.response, sender: "gemini" },
        ]);
      } else {
        console.error("Gemini API 호출 실패");
        setMessages([
          ...messages,
          { text: inputMessage, sender: "user" },
          { text: "죄송해요. 지금은 답할 수 없어요.", sender: "gemini" },
        ]);
      }
    } catch (error) {
      console.error("API 요청 오류:", error);
      setMessages([
        ...messages,
        { text: inputMessage, sender: "user" },
        { text: "죄송해요. 서버에 연결할 수 없어요.", sender: "gemini" },
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>AI 챗봇</h3>
        <button className="close-button" onClick={onClose}>
          X
        </button>
      </div>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.sender === "user" ? "user-message" : "gemini-message"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={inputMessage}
          onChange={handleInputChange}
        />
        <button onClick={handleSendMessage}>전송</button>
      </div>
    </div>
  );
};

export default Chatbot;
