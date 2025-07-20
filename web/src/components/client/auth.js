'use client';

import { useEffect } from 'react';



export default function Auth() {
    useEffect(() => {
        const refresh = async () => {
            await fetch('/api/token-refresh', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
            });
        };
        refresh();
        const interval = setInterval(refresh, 280000);
        return () => clearInterval(interval);
    }, []);

    return null;
}