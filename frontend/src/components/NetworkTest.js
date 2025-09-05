import React, { useState } from 'react';

const NetworkTest = () => {
  const [result, setResult] = useState('');

  const testConnection = async () => {
    try {
      const response = await fetch('http://192.168.0.183:8000/api/auth/login/', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://192.168.0.183:3000'
        }
      });
      setResult(`Connection OK: ${response.status}`);
    } catch (error) {
      setResult(`Connection Failed: ${error.message}`);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, background: 'white', padding: 10, border: '1px solid black' }}>
      <button onClick={testConnection}>Test Backend</button>
      <div>{result}</div>
    </div>
  );
};

export default NetworkTest;