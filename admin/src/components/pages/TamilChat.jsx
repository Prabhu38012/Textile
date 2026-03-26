import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

import './TamilChat.css';

const TamilChat = ({ userId, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [language, setLanguage] = useState('ta');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatId = useRef(null);
  const prevMessageCountRef = useRef(0);
  const shouldAutoScrollRef = useRef(true);

  const uiText = {
    ta: {
      title: 'உரையாடல்',
      subtitle: 'வாடிக்கையாளர் ஆதரவு',
      toggleTitle: 'உரையாடல்',
      welcome: 'வணக்கம்! 👋',
      welcomeSub: 'உங்களுக்கு எவ்வாறு உதவ முடியும்?',
      placeholder: 'செய்தியை தட்டச்சு செய்யவும்...'
    },
    en: {
      title: 'Chat',
      subtitle: 'Customer Support',
      toggleTitle: 'Chat',
      welcome: 'Hello! 👋',
      welcomeSub: 'How can we help you today?',
      placeholder: 'Type your message...'
    }
  };

  const quickResponsesByLanguage = {
    ta: [
      'வணக்கம்',
      'நன்றி',
      'உதவி வேண்டும்',
      'விலை என்ன?',
      'இது கிடைக்குமா?',
      'டெலிவரி எவ்வளவு நாள்?'
    ],
    en: [
      'Hello',
      'Thank you',
      'Need help',
      'What is the price?',
      'Is this available?',
      'How many days for delivery?'
    ]
  };

  const t = uiText[language];
  const quickResponses = quickResponsesByLanguage[language];

  useEffect(() => {
    if (isOpen) {
      shouldAutoScrollRef.current = true; // Enable auto-scroll when opening chat
      fetchChat();
      const interval = setInterval(fetchChat, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, userId, language]);

  useEffect(() => {
    // Only auto-scroll if there are new messages and user hasn't scrolled up
    if (messages.length > prevMessageCountRef.current && shouldAutoScrollRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // If user is within 100px of bottom, enable auto-scroll
      shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  const fetchChat = async () => {
    try {
      const response = await fetch(`${API}/api/chat/user/${userId}?userName=${encodeURIComponent(userName)}&language=${language}`);
      const data = await response.json();
      chatId.current = data._id;
      setMessages(data.messages || []);
      
      // Mark admin messages as read
      if (data.messages?.some(msg => msg.sender === 'admin' && !msg.read)) {
        await fetch(`${API}/api/chat/${data._id}/read`, {
          method: 'PUT'
        });
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    setLoading(true);
    shouldAutoScrollRef.current = true; // Always scroll when user sends a message
    try {
      const response = await fetch(`${API}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          userName,
          text: text.trim(),
          sender: 'user',
          language
        })
      });

      const data = await response.json();
      setMessages(data.messages || []);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleQuickResponse = (text) => {
    sendMessage(text);
  };

  const unreadCount = messages.filter(msg => msg.sender === 'admin' && !msg.read).length;

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        className="tamil-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={t.toggleTitle}
      >
        💬
        {unreadCount > 0 && (
          <span className="chat-unread-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="tamil-chat-window">
          <div className="tamil-chat-header">
            <div>
              <h3>{t.title}</h3>
              <p className="chat-subtitle">{t.subtitle}</p>
              <div className="chat-language-switch" role="group" aria-label="Choose chat language">
                <button
                  type="button"
                  className={`language-btn ${language === 'ta' ? 'active' : ''}`}
                  onClick={() => setLanguage('ta')}
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  className={`language-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => setLanguage('en')}
                >
                  English
                </button>
              </div>
            </div>
            <button 
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div 
            className="tamil-chat-messages" 
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>{t.welcome}</p>
                <p className="chat-welcome-sub">{t.welcomeSub}</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'admin-message'}`}
                >
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Responses */}
          <div className="tamil-quick-responses">
            {quickResponses.map((response, index) => (
              <button
                key={index}
                className="quick-response-btn"
                onClick={() => handleQuickResponse(response)}
                disabled={loading}
              >
                {response}
              </button>
            ))}
          </div>

          {/* Message Input */}
          <form className="tamil-chat-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t.placeholder}
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !newMessage.trim()}
              className="send-btn"
            >
              {loading ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default TamilChat;
