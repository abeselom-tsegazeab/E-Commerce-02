import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const useWebSocket = (url) => {
  const ws = useRef(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Only create WebSocket connection in browser environment
    if (typeof window !== 'undefined') {
      // Connect to WebSocket server
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          addNotification({
            ...notification,
            id: Date.now(),
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
      };
    }

    // Cleanup function
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, addNotification]);

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage };
};

export default useWebSocket;
