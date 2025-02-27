
import React, { useRef, useEffect } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  poster,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Lógica para lidar com o player quando o componente for montado
    return () => {
      // Limpeza quando o componente for desmontado
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, []);

  return (
    <div className="w-full relative rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay={autoPlay}
        controls={controls}
        loop={loop}
        muted={muted}
        poster={poster}
        className={`w-full h-auto ${className || ""}`}
        onError={(e) => console.error("Erro ao carregar vídeo:", e)}
      />
    </div>
  );
};

export default VideoPlayer;
