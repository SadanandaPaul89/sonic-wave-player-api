
import { useState, useCallback } from 'react';
import { Track } from '@/services/api';

const shuffleArray = (array: Track[]): Track[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const usePlayerQueue = () => {
    const [queue, setQueue] = useState<Track[]>([]);
    const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
    const [isShuffled, setIsShuffled] = useState(false);
    const [playHistory, setPlayHistory] = useState<Track[]>([]);

    const toggleShuffle = useCallback(() => {
        setIsShuffled(prev => {
            const newShuffled = !prev;
            if (newShuffled) {
                setOriginalQueue(queue);
                setQueue(currentQueue => shuffleArray(currentQueue));
            } else {
                setQueue(originalQueue);
                setOriginalQueue([]);
            }
            return newShuffled;
        });
    }, [queue, originalQueue]);

    const addToQueue = (track: Track) => {
        console.log('PlayerContext: Adding track to queue:', track.name);
        setQueue(prev => {
            const newQueue = [...prev, track];
            if (isShuffled) {
                setOriginalQueue(prevOriginal => [...prevOriginal, track]);
            }
            return newQueue;
        });
    };

    const clearQueue = () => {
        console.log('PlayerContext: Clearing queue');
        setQueue([]);
        setOriginalQueue([]);
    };

    return {
        queue, setQueue,
        isShuffled, toggleShuffle,
        playHistory, setPlayHistory,
        addToQueue,
        clearQueue,
        originalQueue, setOriginalQueue,
    };
};
