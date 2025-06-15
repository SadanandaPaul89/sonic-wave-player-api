
import React, { useEffect } from 'react';
import { Track } from '@/services/api';
import { recordSongPlay } from '@/services/supabaseService';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface PlayerSideEffectsProps {
    currentTrack: Track | null;
    isPlaying: boolean;
    progress: number;
    duration: number;
    volume: number;
    hasRecordedPlay: boolean;
    setHasRecordedPlay: (recorded: boolean) => void;
    setVolumeLevel: (level: number) => void;
    togglePlayPause: () => void;
    playNextTrack: () => void;
    playPreviousTrack: () => void;
    seekToPosition: (position: number) => void;
    pausePlayback: () => void;
    resumePlayback: () => void;
}

export const usePlayerSideEffects = ({
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    hasRecordedPlay,
    setHasRecordedPlay,
    setVolumeLevel,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seekToPosition,
    pausePlayback,
    resumePlayback,
}: PlayerSideEffectsProps) => {

    // Record song play after 5 seconds
    useEffect(() => {
        if (isPlaying && currentTrack && !hasRecordedPlay && progress > 5) {
            recordSongPlay(currentTrack.id);
            setHasRecordedPlay(true);
        }
    }, [isPlaying, currentTrack, hasRecordedPlay, progress, setHasRecordedPlay]);

    // Reset play record status on track change
    useEffect(() => {
        setHasRecordedPlay(false);
    }, [currentTrack, setHasRecordedPlay]);

    // Volume control for keyboard shortcuts
    const handleVolumeUp = () => setVolumeLevel(Math.min(1, volume + 0.1));
    const handleVolumeDown = () => setVolumeLevel(Math.max(0, volume - 0.1));
    const handleMute = () => setVolumeLevel(volume > 0 ? 0 : 0.7);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onTogglePlayPause: togglePlayPause,
        onNextTrack: playNextTrack,
        onPreviousTrack: playPreviousTrack,
        onVolumeUp: handleVolumeUp,
        onVolumeDown: handleVolumeDown,
        onMute: handleMute,
    });

    // Media Session API
    const { resumeAudioContext } = useMediaSession({
        currentTrack,
        isPlaying,
        progress,
        duration,
        onPlay: resumePlayback,
        onPause: pausePlayback,
        onNextTrack: playNextTrack,
        onPreviousTrack: playPreviousTrack,
        onSeek: seekToPosition,
    });

    // Resume audio context on user interaction
    useEffect(() => {
        const handleUserInteraction = () => {
            resumeAudioContext();
        };

        document.addEventListener('click', handleUserInteraction, { once: true });
        document.addEventListener('keydown', handleUserInteraction, { once: true });

        return () => {
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
        };
    }, [resumeAudioContext]);
};

