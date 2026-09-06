
import { useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import './ChatMessages.css'

function useAutoScroll(dependencies) {
        const containerRef = useRef(null);

        useEffect(() => {
          const containerElem = containerRef.current;

          if (containerElem) {
            containerElem.scrollTop = containerElem.scrollHeight;
          }
        }, [dependencies]);

        return containerRef;

      }


function ChatMessages({ chatMessages, setChatMessages }) {

  const chatMessagesRef = useAutoScroll([chatMessages])

  // Flips contactSent on the one message whose form was just submitted,
  // rather than a full array rebuild — mirrors how ChatInput updates messages.
  function markContactSent(id) {
    setChatMessages(chatMessages.map((chatMessage) =>
      chatMessage.id === id ? { ...chatMessage, contactSent: true } : chatMessage
    ));
  }

  return (
    <div className= "chat-messages-container"
    ref = {chatMessagesRef}>
      {chatMessages.map((chatMessage) => {
            return (
              <ChatMessage
                message={chatMessage.message}
                sender={chatMessage.sender}
                canOfferContact={chatMessage.canOfferContact}
                question={chatMessage.question}
                contactSent={chatMessage.contactSent}
                onContactSent={() => markContactSent(chatMessage.id)}
                isLoading={chatMessage.isLoading}
                key= {chatMessage.id}
              />
            );
      })}
    </div>
  );
}

export default ChatMessages