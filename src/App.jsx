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
      <div style={styles.contentWrapper}>
        {messages.map((msg, i) => (
          <div key={i} style={{...styles.line, color: msg.role === 'user' ? '#000' : '#777'}}>
            {msg.text}
          </div>
        ))}
        {showBegin && <div style={styles.begin}>begin.</div>}
        <form onSubmit={handleSubmit} style={styles.inputForm}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={styles.input}
            autoComplete="off"
          />
          <span className="cursor"></span>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#fff',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
  },
  begin: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '20px',
  },
  line: {
    marginBottom: '12px',
    fontSize: '18px',
  },
  inputForm: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '16px',
  },
  input: {
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '18px',
    color: '#000',
    caretColor: 'transparent',
    textAlign: 'center',
    width: '100%',
  },
};