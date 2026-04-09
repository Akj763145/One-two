import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { toast } from 'sonner';

interface VideoPlayerProps {
  options: any;
  onReady?: (player: any) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const { options, onReady } = props;

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');
      videoElement.classList.add('vjs-theme-city');
      
      if (videoRef.current) {
        videoRef.current.appendChild(videoElement);
      }

      const player = playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');
        onReady && onReady(player);
      });

      // Handle Errors
      player.on('error', () => {
        const error = player.error();
        console.error('VideoJS Error:', error);
        toast.error('Streaming failed. This is usually due to an invalid API key or the file not being public.');
      });

    } else {
      const player = playerRef.current;

      player.autoplay(options.autoplay);
      
      // Only update source if it actually changed to prevent restarts
      const currentSrc = player.src();
      const newSrc = options.sources?.[0]?.src;
      
      // Video.js src() might return the full URL, so we check if it includes our relative path
      if (newSrc && !currentSrc.includes(newSrc)) {
        player.src(options.sources);
      }
    }
  }, [options, videoRef]);

  // Dispose the player on unmount
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <div ref={videoRef} className="w-full h-full" />
    </div>
  );
}

export default VideoPlayer;
