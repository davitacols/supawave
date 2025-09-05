import { useEffect, useRef, useState } from 'react';

const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !url) return;

    const wsUrl = `ws://localhost:8000${url}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  return { isConnected };
};

export default useWebSocket;