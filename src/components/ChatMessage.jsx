import RobotProfileImage from '../assets/robot.png'
import FidoImage from '../assets/Fido.jpg'
import WallPaperImage from '../assets/wallpaper.jpg'
import dayjs from 'dayjs'
import { ContactForm } from './ContactForm'

import './ChatMessage.css'

// canOfferContact/question/contactSent only ever appear on a robot message
// the backend flagged as unanswered (see api/chat.js's UNANSWERED_MARKER);
// onContactSent reports back up to App.jsx's chatMessages state once the note
// is actually sent, so the form->confirmation swap survives a reload.
// isLoading marks the placeholder gif message (see ChatInput.jsx) — it gets
// a plain, bubble-free treatment with no timestamp since it's not a real reply.
export function ChatMessage({ message, sender, canOfferContact, question, contactSent, onContactSent, isLoading }) {
    const time = dayjs().valueOf();
    return (
        <div className={
        sender === 'user'
        ? 'chat-message-user'
        : 'chat-message-robot'}>
        {sender === 'robot' && (
            <img src={FidoImage} className = "chat-message-profile"/>
        )}
        {isLoading ? (
            <div className="chat-message-loading">
                {message}
            </div>
        ) : (
            <div className = "chat-message-text">
                {message}
                {canOfferContact && (
                    contactSent
                        ? <p className="contact-form-prompt">
                            Thanks! Gunho will get back to you on this soon — and once he answers,
                            I'll learn it too, so I can answer it myself next time.
                          </p>
                        : <ContactForm question={question} onSent={onContactSent} />
                )}
                <p className='time-text'>
                    {dayjs(time).format('h:mma')}
                </p>
            </div>
        )}
        {sender === 'user' && (
            <img src={WallPaperImage} className = "chat-message-profile"/>
        )}
        {/* <img src="user.png" width="50"/> */}
        </div>
    );
}