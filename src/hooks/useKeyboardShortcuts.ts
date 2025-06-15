
import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onTogglePlayPause: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onMute: () => void;
}

export const useKeyboardShortcuts = ({
  onTogglePlayPause,
  onNextTrack,
  onPreviousTrack,
  onVolumeUp,
  onVolumeDown,
  onMute
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onTogglePlayPause();
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onNextTrack();
          }
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onPreviousTrack();
          }
          break;
        case 'ArrowUp':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onVolumeUp();
          }
          break;
        case 'ArrowDown':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onVolumeDown();
          }
          break;
        case 'KeyM':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onMute();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onTogglePlayPause, onNextTrack, onPreviousTrack, onVolumeUp, onVolumeDown, onMute]);
};
