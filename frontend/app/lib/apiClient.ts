// API utility to automatically include JWT token in requests
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

export function useApi() {
    const { token } = useContext(AuthContext);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
        const headers: HeadersInit = {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error ${response.status}: ${errorText}`);
        }
        return response.json();
    };

    const streamApiFetch = async (endpoint: string, options: RequestInit = {}, onMessage: (msg: any) => void) => {
        const headers: HeadersInit = {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error ${response.status}: ${errorText}`);
        }

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const msg = JSON.parse(line);
                    onMessage(msg);
                } catch (e) {
                    console.error('Failed to parse NDJSON line:', e);
                }
            }
        }
    };

    return { apiFetch, streamApiFetch };
}
