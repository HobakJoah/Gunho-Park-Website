import { useState, useEffect } from 'react'
import { ChatInput } from './components/ChatInput'
import  ChatMessages  from './components/ChatMessages'
import './App.css'


function App() {
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    localStorage.setItem('messages', JSON.stringify(chatMessages));
  }, [chatMessages])
  
  return (
    <div className="app-container">

      {chatMessages.length === 0 
        ? <p className = "welcome-text">
          Welcome to the chatbot project! 
          Send a message using the textbox below.
          </p> 
        : <p></p>}
      <ChatMessages 
        chatMessages={chatMessages}
      />

      <ChatInput 
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
      />
    </div>
  );
}

export default App
