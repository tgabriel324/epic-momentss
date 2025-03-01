
import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, PauseCircle, PlayCircle } from "lucide-react";
import VideoPlayer from "@/components/video/VideoPlayer";

interface QRScanResultProps {
  scannedVideo: {
    url: string;
    title: string;
  };
  videoPlaying: boolean;
  setVideoPlaying: (playing: boolean) => void;
  onScanAgain: () => void;
}

const QRScanResult: React.FC<QRScanResultProps> = ({
  scannedVideo,
  videoPlaying,
  setVideoPlaying,
  onScanAgain
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="w-full aspect-square md:aspect-video relative bg-black rounded-lg overflow-hidden">
        <VideoPlayer
          videoUrl={scannedVideo.url}
          autoPlay={videoPlaying}
          loop={true}
          controls={true}
          className="w-full h-full object-contain"
          onLoadedData={() => setVideoPlaying(true)}
        />
        
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
          <h3 className="text-white font-medium text-lg">{scannedVideo.title}</h3>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row w-full space-y-2 sm:space-y-0 sm:space-x-4">
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={onScanAgain}
        >
          <Camera className="mr-2 h-5 w-5" />
          Escanear novamente
        </Button>
        <Button 
          variant={videoPlaying ? "destructive" : "default"}
          className="w-full sm:w-auto"
          onClick={() => setVideoPlaying(!videoPlaying)}
        >
          {videoPlaying ? (
            <>
              <PauseCircle className="mr-2 h-5 w-5" />
              Pausar
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-5 w-5" />
              Reproduzir
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default QRScanResult;
