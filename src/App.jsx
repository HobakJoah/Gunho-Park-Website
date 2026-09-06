import { useState, useEffect } from 'react'
import { ChatInput } from './components/ChatInput'
import  ChatMessages  from './components/ChatMessages'
import './App.css'

// The loading-spinner placeholder message holds JSX, which can't survive
// JSON.stringify — filter out anything that isn't a plain string so a stale
// placeholder (e.g. the tab closed mid-request) doesn't come back broken.
function loadStoredMessages() {
  try {
    const stored = localStorage.getItem('messages');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed)
      ? parsed.filter((chatMessage) => typeof chatMessage?.message === 'string')
      : [];
  } catch {
    return [];
  }
}

function App() {
  const [chatMessages, setChatMessages] = useState(loadStoredMessages);

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
