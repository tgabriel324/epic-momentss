
import React, { useRef, useEffect, useState } from "react";

interface VideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
  className?: string;
  preload?: "auto" | "metadata" | "none";
  quality?: "low" | "medium" | "high" | "auto";
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: (error: any) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  poster,
  className,
  preload = "auto",
  quality = "auto",
  onLoadStart,
  onLoadedData,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Função para determinar a qualidade do vídeo
  const getOptimizedVideoUrl = (url: string, quality: string): string => {
    // Idealmente, aqui seria onde você teria diferentes versões do vídeo para diferentes qualidades
    // Por exemplo, para implementação real, você poderia ter:
    // - url-low.mp4
    // - url-medium.mp4
    // - url-high.mp4
    
    // Para este exemplo, estamos apenas retornando a URL original
    // Em um cenário real, você modificaria a URL com base na qualidade
    return url;
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Optimize video loading
    videoElement.preload = preload;
    
    // Adaptar a URL com base na qualidade
    const optimizedUrl = getOptimizedVideoUrl(videoUrl, quality);
    videoElement.src = optimizedUrl;
    
    // Event listeners
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error("Erro ao carregar vídeo:", e);
      setHasError(true);
      setErrorMessage("Erro ao carregar o vídeo. Tente novamente mais tarde.");
      if (onError) onError(e);
    };
    const handleLoadStart = () => {
      if (onLoadStart) onLoadStart();
    };
    const handleLoadedData = () => {
      if (onLoadedData) onLoadedData();
    };

    videoElement.addEventListener("waiting", handleWaiting);
    videoElement.addEventListener("playing", handlePlaying);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("error", handleError);
    videoElement.addEventListener("loadstart", handleLoadStart);
    videoElement.addEventListener("loadeddata", handleLoadedData);

    // Se estiver em uma conexão lenta, podemos tentar baixar a qualidade
    if ('connection' in navigator && (navigator as any).connection) {
      const connection = (navigator as any).connection;
      if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        videoElement.src = getOptimizedVideoUrl(videoUrl, 'low');
      }
    }

    return () => {
      // Cleanup
      videoElement.removeEventListener("waiting", handleWaiting);
      videoElement.removeEventListener("playing", handlePlaying);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("error", handleError);
      videoElement.removeEventListener("loadstart", handleLoadStart);
      videoElement.removeEventListener("loadeddata", handleLoadedData);
      
      videoElement.pause();
      videoElement.src = "";
      videoElement.load();
    };
  }, [videoUrl, preload, quality, onLoadStart, onLoadedData, onError]);

  return (
    <div className="w-full relative rounded-lg overflow-hidden">
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center p-4">
            <p className="text-white mb-2">{errorMessage}</p>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md text-sm"
              onClick={() => {
                if (videoRef.current) {
                  setHasError(false);
                  videoRef.current.load();
                  videoRef.current.play().catch(e => console.error("Erro ao reproduzir vídeo:", e));
                }
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        controls={controls}
        loop={loop}
        muted={muted}
        poster={poster}
        className={`w-full h-auto ${className || ""}`}
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
