export type AudioTrack = {
  id: string;
  title: string;
  artist?: string;
  cover?: string;
  url: string;
  duration?: number;
};

export type AudioState = {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
};
