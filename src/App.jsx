import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showBegin, setShowBegin] = useState(true);
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
    if (input.length > 0) setShowBegin(false);
  }, [input]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  return (
    <div style={styles.container}>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{ ...styles.line, color: msg.role === 'user' ? '#222' : '#555' }}
        >
          {msg.text}
        </div>
      ))}
      {showBegin && <div style={styles.begin}>begin.</div>}
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          style={styles.input}
          autoComplete="off"
        />
      </form>
      <div style={styles.cursor}></div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8f6f2',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: '20px',
    minHeight: '100vh',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  begin: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '10px',
  },
  line: {
    marginBottom: '8px',
  },
  input: {
    backgroundColor: '#f8f6f2',
    border: 'none',
    outline: 'none',
    font: 'inherit',
    color: '#222',
    width: '100%',
    caretColor: '#222',
  },
  cursor: {
    width: '10px',
    height: '20px',
    backgroundColor: '#222',
    opacity: 1,
    animation: 'breathe 6s infinite ease-in-out',
    marginTop: '8px',
  },
  '@keyframes breathe': {
    '0%': { opacity: 0.2 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.2 },
  },
};