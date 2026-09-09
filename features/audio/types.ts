export type AudioTrack = {
  id: string;
  title: string;
  artist?: string;
  cover?: string;
  url: string;
  duration?: number;
  sourceHref?: string;
};

export type AudioState = {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isReady: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  error: string | null;
  levels: number[];
  queue: AudioTrack[];
};

export type PlayTrackOptions = {
  queue?: AudioTrack[];
  autoplay?: boolean;
  restart?: boolean;
};
