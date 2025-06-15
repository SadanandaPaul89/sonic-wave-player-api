
import React, { useEffect } from 'react';
import { Track } from '@/services/api';
import { recordSongPlay } from '@/services/supabaseService';
import { useMediaSession } from '@/hooks/useMediaSession';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/hooks/use-toast';

interface PlayerSideEffectsProps {
    currentTrack: Track | null;
    isPlaying: boolean;
    isPausedByVisibility: boolean;
    wasPlayingBeforeHidden: boolean;
    progress: number;
    duration: number;
    volume: number;
    hasRecordedPlay: boolean;
    setIsPlaying: (playing: boolean) => void;
    setIsPausedByVisibility: (paused: boolean) => void;
    setWasPlayingBeforeHidden: (was: boolean) => void;
    setHasRecordedPlay: (recorded: boolean) => void;
    setVolumeLevel: (level: number) => void;
    togglePlayPause: () => void;
    playNextTrack: () => void;
    playPreviousTrack: () => void;
    seekToPosition: (position: number) => void;
}

export const usePlayerSideEffects = ({
    currentTrack,
    isPlaying,
    isPausedByVisibility,
    wasPlayingBeforeHidden,
    progress,
    duration,
    volume,
    hasRecordedPlay,
    setIsPlaying,
    setIsPausedByVisibility,
    setWasPlayingBeforeHidden,
    setHasRecordedPlay,
    setVolumeLevel,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    seekToPosition,
}: PlayerSideEffectsProps) => {
    const { toast } = useToast();
    const isPageVisible = usePageVisibility();

    // Page visibility handler
    useEffect(() => {
        if (!currentTrack) return;

        if (!isPageVisible && isPlaying) {
            console.log('Page hidden, pausing audio to prevent conflicts');
            setWasPlayingBeforeHidden(true);
            setIsPlaying(false);
            setIsPausedByVisibility(true);
            toast({
                title: "Audio Paused",
                description: "Music paused to prevent conflicts with other apps",
                duration: 3000,
            });
        } else if (isPageVisible && isPausedByVisibility && wasPlayingBeforeHidden) {
            console.log('Page visible again, offering to resume audio');
            toast({
                title: "Resume Playback?",
                description: "Click to resume your music",
                duration: 5000,
                action: (
                    <button
                        onClick={() => {
                            setIsPlaying(true);
                            setIsPausedByVisibility(false);
                            setWasPlayingBeforeHidden(false);
                        }}
                        className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-200"
                    >
                        Resume
                    </button>
                ),
            });
            setIsPausedByVisibility(false);
        }
    }, [isPageVisible, isPlaying, isPausedByVisibility, wasPlayingBeforeHidden, currentTrack, toast, setIsPlaying, setIsPausedByVisibility, setWasPlayingBeforeHidden]);
    
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
        onPlay: togglePlayPause,
        onPause: togglePlayPause,
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
