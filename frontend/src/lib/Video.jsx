import { useEffect, useRef, useState, useMemo } from 'react';
import { useTimeline } from './context';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * Video component that syncs with the Framely timeline.
 *
 * The video's playback position is controlled by the current frame,
 * ensuring perfect sync between the video and your composition.
 *
 * Props:
 *   src            - Video source URL (use staticFile() for local assets)
 *   volume         - Volume level 0-1, or a callback (frame) => number
 *   playbackRate   - Playback speed multiplier (default: 1)
 *   muted          - Whether to mute audio (default: false)
 *   loop           - Loop the video (default: false)
 *   startFrom      - Frame to start playing from (default: 0)
 *   endAt          - Frame to stop playing at (optional)
 *   style          - CSS styles
 *   className      - CSS class name
 *   onError        - Callback when video fails to load
 *   ...rest        - Standard video props
 *
 * Usage:
 *   import { Video, staticFile } from './lib';
 *
 *   <Video src={staticFile('videos/intro.mp4')} />
 *   <Video src={staticFile('videos/bg.mp4')} volume={0.5} muted />
 *   <Video
 *     src={staticFile('videos/clip.mp4')}
 *     startFrom={30}
 *     endAt={90}
 *     volume={(frame) => interpolate(frame, [0, 30], [0, 1])}
 *   />
 */
export function Video({
  src,
  volume = 1,
  playbackRate = 1,
  muted = false,
  loop = false,
  startFrom = 0,
  endAt,
  style,
  className,
  onError,
  ...rest
}) {
  const { frame, fps, playing } = useTimeline();
  const videoRef = useRef(null);
  const handleRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Calculate the actual volume (support callback)
  const actualVolume = useMemo(() => {
    if (typeof volume === 'function') {
      return Math.max(0, Math.min(1, volume(frame)));
    }
    return Math.max(0, Math.min(1, volume));
  }, [volume, frame]);

  // Calculate target time based on frame
  const targetTime = useMemo(() => {
    const relativeFrame = frame - startFrom;
    if (relativeFrame < 0) return 0;
    return relativeFrame / fps;
  }, [frame, startFrom, fps]);

  // Check if we're within the video's active range
  const isActive = useMemo(() => {
    if (frame < startFrom) return false;
    if (endAt !== undefined && frame >= endAt) return false;
    return true;
  }, [frame, startFrom, endAt]);

  // Delay render until video is ready
  useEffect(() => {
    handleRef.current = delayRender(`Loading video: ${src}`, {
      timeoutInMilliseconds: 30000,
    });

    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [src]);

  // Handle video ready state
  const handleCanPlay = () => {
    setReady(true);
    if (handleRef.current !== null) {
      continueRender(handleRef.current);
      handleRef.current = null;
    }
  };

  // Handle video error
  const handleError = (event) => {
    const err = new Error(`Failed to load video: ${src}`);
    onError?.(event);

    if (handleRef.current !== null) {
      cancelRender(err);
      handleRef.current = null;
    }
  };

  // Sync video time with frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    // Only seek if we're more than half a frame off
    const tolerance = 0.5 / fps;
    if (Math.abs(video.currentTime - targetTime) > tolerance) {
      video.currentTime = targetTime;
    }
  }, [targetTime, ready, fps]);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = actualVolume;
  }, [actualVolume]);

  // Sync playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync muted state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  // Handle play/pause (for preview mode)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    if (playing && isActive) {
      video.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    } else {
      video.pause();
    }
  }, [playing, ready, isActive]);

  // Don't render if outside active range
  if (!isActive) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      src={src}
      style={{
        ...style,
        opacity: ready ? (style?.opacity ?? 1) : 0,
      }}
      className={className}
      onCanPlayThrough={handleCanPlay}
      onError={handleError}
      playsInline
      preload="auto"
      loop={loop}
      {...rest}
    />
  );
}

export default Video;
