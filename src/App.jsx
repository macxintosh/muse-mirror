import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

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
      <div style={styles.inputWrapper}>
        {messages.map((msg, i) => (
          <div key={i} style={{ ...styles.line, color: msg.role === 'user' ? '#222' : '#555' }}>
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
        <div className="cursor"></div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#f8f6f2',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    fontSize: '24px',
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
  },
  begin: {
    color: '#999',
    fontSize: '18px',
    marginBottom: '10px',
  },
  line: {
    marginBottom: '10px',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    font: 'inherit',
    color: '#222',
    width: '100%',
    caretColor: '#222',
    textAlign: 'center',
  },
};
