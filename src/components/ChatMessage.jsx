import RobotProfileImage from '../assets/robot.png'
import UserProfileImage from '../assets/user.png'
import WallPaperImage from '../assets/wallpaper.jpg'
import dayjs from 'dayjs'

import './ChatMessage.css'

export function ChatMessage({ message, sender }) {
    const time = dayjs().valueOf();
    return (
        <div className={
        sender === 'user' 
        ? 'chat-message-user' 
        : 'chat-message-robot'}>
        {sender === 'robot' && (
            <img src={RobotProfileImage} className = "chat-message-profile"/>
        )}
        <div className = "chat-message-text">
            {message}
            <p className='time-text'>
                {dayjs(time).format('h:mma')}
            </p>
        </div>
        {sender === 'user' && (
            <img src={WallPaperImage} className = "chat-message-profile"/>
        )}
        {/* <img src="user.png" width="50"/> */}
        </div>
    );
}