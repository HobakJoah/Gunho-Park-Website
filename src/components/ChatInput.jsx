import { useState } from 'react'
import YourNameCometGif from '../assets/YourName_Comet.gif'
import './ChatInput.css'

// Gemini's chat format only wants role + text turns, and only ever saw string
// messages (the loading spinner is JSX and never makes it into chatMessages
// as a final message), but we filter defensively anyway.
function toGeminiHistory(chatMessages) {
    return chatMessages
        .filter((chatMessage) => typeof chatMessage.message === 'string')
        .map((chatMessage) => ({
            role: chatMessage.sender === 'user' ? 'user' : 'model',
            parts: [{ text: chatMessage.message }]
        }));
}

export function ChatInput({ chatMessages, setChatMessages }) {

    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    function saveInputText(event) {
        setInputText(event.target.value);
    }

    function keyboardEvent(event) {
        {event.key === 'Enter' && sendMessage()}

        {event.key == 'Escape' && setInputText('')}
    }

    async function sendMessage() {

        if (isLoading || inputText === '') {
        return;
        }

        // Local-only command: the whole conversation lives in chatMessages
        // (and its localStorage mirror in App.jsx), so clearing it never
        // touches the backend.
        if (inputText.trim().toLowerCase() === '/clear') {
            setChatMessages([]);
            setInputText('');
            return;
        }

        setIsLoading(true);
        const history = toGeminiHistory(chatMessages);
        const newChatMessages = [
        ...chatMessages,
        {
            message: inputText,
            sender: 'user',
            id: crypto.randomUUID()
        }
        ];

        setChatMessages(newChatMessages);
        setInputText('');

        setChatMessages([
        ...newChatMessages,
        {
            message: <img
                    src= {YourNameCometGif}
                    className = "loading-spinner-box"></img>,
            sender: 'robot',
            id: crypto.randomUUID(),
            // ChatMessage skips the bubble background and timestamp for this one.
            isLoading: true
        }
        ])

        let responseText;
        let canOfferContact = false;
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputText, history })
            });

            const data = await response.json().catch(() => ({}));

            // The server sends a specific, user-safe message for known failure
            // cases (rate limited, out of quota, bad input) — show that instead
            // of a generic fallback whenever one comes back.
            responseText = response.ok
                ? data.reply
                : data.error || "Sorry, I ran into an error responding. Please try again.";
            canOfferContact = response.ok && Boolean(data.canOfferContact);
        } catch (error) {
            console.error('Chat request failed:', error);
            responseText = "Sorry, I ran into an error responding. Please try again.";
        }

        setChatMessages([
        ...newChatMessages,
        {
            message: responseText,
            sender: 'robot',
            id: crypto.randomUUID(),
            // Only set when the backend couldn't answer from about-me.md —
            // ChatMessage shows a "send this to Gunho?" form when this is true.
            ...(canOfferContact ? { canOfferContact: true, question: inputText } : {})
        }
        ]);

        setIsLoading(false);
    }

    return (
        <div className = "chat-input-container">
        <input
            placeholder="Ask anything about me!"
            size="30"
            onChange={saveInputText}
            onKeyDown={keyboardEvent}
            value={inputText}
            className="chat-input"
        />
        <button
            onClick={sendMessage}
            className="send-button"
        >Send</button>
        </div>
    );
}
