
import { Track } from './api';

const LOCAL_TRACKS_KEY = 'local_music_library';

// Add a new track to the local library
export const addLocalTrack = (track: Track) => {
  const existingTracks = getAllLocalTracks();
  const updatedTracks = [...existingTracks, track];
  localStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(updatedTracks));
  return track;
};

// Get all tracks from the local library
export const getAllLocalTracks = (): Track[] => {
  const tracksJson = localStorage.getItem(LOCAL_TRACKS_KEY);
  if (!tracksJson) return [];
  
  try {
    return JSON.parse(tracksJson);
  } catch (error) {
    console.error('Error parsing local tracks:', error);
    return [];
  }
};

// Remove a track from the local library
export const removeLocalTrack = (trackId: string) => {
  const existingTracks = getAllLocalTracks();
  const updatedTracks = existingTracks.filter(track => track.id !== trackId);
  localStorage.setItem(LOCAL_TRACKS_KEY, JSON.stringify(updatedTracks));
};

// Clear all local tracks
export const clearLocalLibrary = () => {
  localStorage.removeItem(LOCAL_TRACKS_KEY);
};
