import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const askGPT = async (userInput) => {
    const res = await fetch('/api/mirror', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput }),
    });
    const data = await res.json();
    return data.reply;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    const reply = await askGPT(input);
    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  return (
    <div className="container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input"
          autoComplete="off"
        />
        <span className="cursor"></span>
      </form>
    </div>
  );
}