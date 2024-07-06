import { useEffect, useState } from 'react';

const useWebSocket = (url, onDataReceived) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onDataReceived(data);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [url, onDataReceived]);

  const sendData = (data) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  };

  return { sendData };
};

export default useWebSocket;
