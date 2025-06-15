
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
            audio.pause();
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
    
    // Load new track
    useEffect(() => {
        if (currentTrack && audio) {
            console.log('Loading track:', currentTrack.name);
            audio.src = currentTrack.previewURL;
            audio.load();
        }
    }, [currentTrack, audio]);
    
    // Control play/pause
    useEffect(() => {
        if (audio) {
            if (isPlaying) {
                console.log('Playing audio, current src:', audio.src);
                audio.play().catch(e => console.error('Error playing audio:', e));
            } else {
                console.log('Pausing audio');
                audio.pause();
            }
        }
    }, [isPlaying, audio]);

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
