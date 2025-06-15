
import { useEffect } from 'react';
import { Track } from '@/services/api';

interface AudioControlsProps {
    audio: HTMLAudioElement | null;
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    onTrackEnd: () => void;
}

export const useAudioControls = ({
    audio,
    currentTrack,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    onTrackEnd
}: AudioControlsProps) => {

    // Setup and teardown audio element and listeners
    useEffect(() => {
        if (!audio) {
            return;
        }

        const updateProgress = () => setProgress(audio.currentTime);
        const setAudioDuration = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setAudioDuration);
        
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', setAudioDuration);
        };
    }, [audio, setDuration, setProgress]);

    // Handle 'ended' event listener separately
    useEffect(() => {
        if (audio) {
            audio.addEventListener('ended', onTrackEnd);
            return () => {
                audio.removeEventListener('ended', onTrackEnd);
            };
        }
    }, [onTrackEnd, audio]);
    
    // Combined effect for loading, playing, and pausing
    useEffect(() => {
        if (!audio) return;

        if (currentTrack) {
            // Set the src only if it's different to avoid reloading
            if (audio.src !== currentTrack.previewURL) {
                console.log('Setting new audio source:', currentTrack.name);
                audio.src = currentTrack.previewURL;
            }

            if (isPlaying) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Playback error:", error);
                    });
                }
            } else {
                audio.pause();
            }
        } else {
            audio.pause();
        }
    }, [currentTrack, isPlaying, audio]);


    // Control volume
    useEffect(() => {
        if (audio) {
            audio.volume = volume;
        }
    }, [volume, audio]);
    
    const seekToPosition = (position: number) => {
        if (audio) {
            audio.currentTime = position;
            setProgress(position);
        }
    };
    
    return { seekToPosition };
};
