import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { updateStateIncremental } from '../store/projectSlice';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';

export const useWebSocket = (projectId: string | undefined) => {
  const dispatch = useDispatch();
  const socketRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;

    const tg = (window as any).Telegram?.WebApp;
    const token = tg?.initData || '';
    
    // Construct WS URL with auth and project subscription
    const wsUrl = `${WS_BASE_URL}/ws?projectId=${projectId}&token=${encodeURIComponent(token)}`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state_updated' && data.projectId === projectId) {
          dispatch(updateStateIncremental(data.payload));
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected, retrying in 3s...');
      setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket.close();
    };
  }, [projectId, dispatch]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return socketRef.current;
};
