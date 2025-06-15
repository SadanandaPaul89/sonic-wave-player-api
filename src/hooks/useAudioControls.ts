
import { useRef, useEffect } from 'react';
import { Track } from '@/services/api';

interface AudioControlsProps {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    onTrackEnd: () => void;
}

export const useAudioControls = ({
    currentTrack,
    isPlaying,
    volume,
    setProgress,
    setDuration,
    onTrackEnd
}: AudioControlsProps) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Setup and teardown audio element and listeners
    useEffect(() => {
        audioRef.current = new Audio();
        const audio = audioRef.current;

        const updateProgress = () => setProgress(audio.currentTime);
        const setAudioDuration = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setAudioDuration);
        
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', setAudioDuration);
            audio.pause();
            audioRef.current = null;
        };
    }, [setDuration, setProgress]);

    // Handle 'ended' event listener separately
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.addEventListener('ended', onTrackEnd);
            return () => {
                audio.removeEventListener('ended', onTrackEnd);
            };
        }
    }, [onTrackEnd]);
    
    // Load new track
    useEffect(() => {
        if (currentTrack && audioRef.current) {
            console.log('Loading track:', currentTrack.name);
            audioRef.current.src = currentTrack.previewURL;
            audioRef.current.load();
        }
    }, [currentTrack]);
    
    // Control play/pause
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                console.log('Playing audio, current src:', audioRef.current.src);
                audioRef.current.play().catch(e => console.error('Error playing audio:', e));
            } else {
                console.log('Pausing audio');
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // Control volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);
    
    const seekToPosition = (position: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = position;
            setProgress(position);
        }
    };
    
    return { audioRef, seekToPosition };
};
