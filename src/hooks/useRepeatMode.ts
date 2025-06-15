
import { useState, useCallback } from 'react';

export type RepeatMode = 'off' | 'all' | 'one';
const repeatModes: RepeatMode[] = ['off', 'all', 'one'];

export const useRepeatMode = () => {
    const [repeatIndex, setRepeatIndex] = useState(0); // 0 = off
    const repeatMode = repeatModes[repeatIndex];

    const toggleRepeatMode = useCallback(() => {
        setRepeatIndex(prev => (prev + 1) % repeatModes.length);
    }, []);

    return { repeatMode, toggleRepeatMode };
};
