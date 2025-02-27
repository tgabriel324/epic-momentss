
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQRCodeStore } from "@/store/qrCodeStore";
import { useVideoStore } from "@/store/videoStore";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Camera, Play, Pause, RefreshCw, Smartphone } from "lucide-react";
import * as THREE from "three";

// Extender a interface do Window para incluir o WebXR
declare global {
  interface Window {
    isSecureContext: boolean;
  }
}

const AR = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getQRCodeById, incrementScans } = useQRCodeStore();
  const { getVideoById } = useVideoStore();

  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [isARSessionActive, setIsARSessionActive] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingState, setLoadingState] = useState<'checking' | 'loading' | 'ready' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const xrSessionRef = useRef<any | null>(null);
  const xrHitTestSourceRef = useRef<any | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const videoPlaneRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Verificar se é simulação ou AR real
  const isRealAR = location.search.includes('realAR=true');
  
  // Obter dados do QR Code e vídeo
  const qrCode = id ? getQRCodeById(id) : null;
  const video = qrCode ? getVideoById(qrCode.videoId) : null;

  // Verificar se o dispositivo suporta WebXR
  useEffect(() => {
    const checkARSupport = async () => {
      if (!window.isSecureContext) {
        setIsARSupported(false);
        setErrorMessage("AR requer um contexto seguro (HTTPS)");
        setLoadingState('error');
        return;
      }

      if (!navigator.xr) {
        setIsARSupported(false);
        setErrorMessage("WebXR não é suportado neste navegador");
        setLoadingState('error');
        return;
      }

      try {
        // @ts-ignore
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        setIsARSupported(supported);
        
        if (supported) {
          setLoadingState('loading');
          loadARResources();
        } else {
          setErrorMessage("Seu dispositivo não suporta Realidade Aumentada");
          setLoadingState('error');
        }
      } catch (error) {
        console.error("Erro ao verificar suporte a WebXR:", error);
        setIsARSupported(false);
        setErrorMessage("Erro ao verificar suporte a AR");
        setLoadingState('error');
      }
    };

    if (id && qrCode && video) {
      checkARSupport();
      // Registrar escaneamento
      incrementScans(id);
    } else {
      setErrorMessage("QR Code ou vídeo não encontrado");
      setLoadingState('error');
    }
  }, [id, qrCode, video, incrementScans]);

  // Carregar recursos necessários para AR
  const loadARResources = () => {
    if (!video) return;

    // Simular o carregamento dos recursos
    let progressValue = 0;
    const interval = setInterval(() => {
      progressValue += 10;
      setProgress(progressValue);
      
      if (progressValue >= 100) {
        clearInterval(interval);
        setLoadingState('ready');
        setupThreeJS();
      }
    }, 200);
  };

  // Configurar Three.js
  const setupThreeJS = () => {
    if (!canvasRef.current) return;

    // Criar cena, câmera e renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Criar iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 5, 0);
    scene.add(directionalLight);

    // Preparar o vídeo como textura
    if (videoRef.current && video) {
      videoRef.current.src = video.url;
      videoRef.current.crossOrigin = "anonymous";
      videoRef.current.loop = true;
      videoRef.current.muted = false;
      videoRef.current.load();

      // Criar textura de vídeo
      const videoTexture = new THREE.VideoTexture(videoRef.current);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBAFormat;
      videoTextureRef.current = videoTexture;

      // Calcular a proporção do vídeo
      const aspectRatio = 16 / 9; // Padrão
      
      // Criar o material com a textura do vídeo
      const videoMaterial = new THREE.MeshBasicMaterial({ 
        map: videoTexture,
        side: THREE.DoubleSide,
      });

      // Criar o plano para projetar o vídeo
      const videoGeometry = new THREE.PlaneGeometry(aspectRatio, 1, 1, 1);
      const videoPlane = new THREE.Mesh(videoGeometry, videoMaterial);
      videoPlaneRef.current = videoPlane;

      // Não adicionar à cena ainda - será adicionado quando o usuário tocar em uma superfície
    }

    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {
      if (rendererRef.current) {
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    }

    toast({
      title: "Pronto para iniciar AR",
      description: "Toque no botão para iniciar a experiência de Realidade Aumentada."
    });
  };

  // Iniciar sessão WebXR
  const startARSession = async () => {
    if (!isARSupported || !navigator.xr) {
      toast({
        title: "AR não suportado",
        description: "Seu dispositivo não suporta Realidade Aumentada.",
        variant: "destructive"
      });
      return;
    }

    try {
      // @ts-ignore
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
      });
      
      xrSessionRef.current = session;
      setIsARSessionActive(true);

      // Configurar a sessão
      setupARSession(session);

      // Adicionar listeners para eventos da sessão
      session.addEventListener('end', () => {
        setIsARSessionActive(false);
        xrSessionRef.current = null;
        xrHitTestSourceRef.current = null;
      });

      toast({
        title: "Sessão AR iniciada",
        description: "Aponte para uma superfície plana e toque para colocar o vídeo."
      });
    } catch (error) {
      console.error("Erro ao iniciar sessão WebXR:", error);
      toast({
        title: "Erro ao iniciar AR",
        description: "Houve um problema ao iniciar a sessão de Realidade Aumentada.",
        variant: "destructive"
      });
    }
  };

  // Configurar sessão AR
  const setupARSession = (session: any) => {
    if (!rendererRef.current) return;

    // @ts-ignore
    rendererRef.current.xr.enabled = true;
    // @ts-ignore
    rendererRef.current.xr.setReferenceSpaceType('local');
    // @ts-ignore
    rendererRef.current.xr.setSession(session);

    // Configurar hit testing para detectar superfícies
    session.requestReferenceSpace('viewer').then((viewerSpace: any) => {
      session.requestHitTestSource({ space: viewerSpace }).then((hitTestSource: any) => {
        xrHitTestSourceRef.current = hitTestSource;
      });
    });

    // Iniciar o loop de renderização
    // @ts-ignore
    rendererRef.current.setAnimationLoop(renderFrame);
  };

  // Função de renderização da sessão AR
  const renderFrame = (timestamp: number, frame: any) => {
    if (!frame || !rendererRef.current || !sceneRef.current) return;

    // Detectar superfícies
    if (xrHitTestSourceRef.current) {
      // @ts-ignore
      const hitTestResults = frame.getHitTestResults(xrHitTestSourceRef.current);
      
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        // @ts-ignore
        const pose = hit.getPose(frame.getReferenceSpace('local'));
        
        if (pose && videoPlaneRef.current && !videoPlaneRef.current.parent) {
          // Posicionar o vídeo na superfície detectada
          videoPlaneRef.current.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          );
          
          // Orientar o vídeo para a câmera
          // @ts-ignore
          const viewerPose = frame.getViewerPose(frame.getReferenceSpace('local'));
          if (viewerPose) {
            const cameraPosition = new THREE.Vector3(
              viewerPose.transform.position.x,
              viewerPose.transform.position.y,
              viewerPose.transform.position.z
            );
            
            // Fazer o vídeo olhar para a câmera, mas manter orientação vertical
            videoPlaneRef.current.lookAt(cameraPosition);
            
            // Adicionar o vídeo à cena
            sceneRef.current.add(videoPlaneRef.current);
            
            // Iniciar reprodução do vídeo
            if (videoRef.current && !isVideoPlaying) {
              videoRef.current.play().then(() => {
                setIsVideoPlaying(true);
              }).catch(error => {
                console.error("Erro ao reproduzir vídeo:", error);
              });
            }
          }
        }
      }
    }

    // Renderizar a cena
    if (rendererRef.current && sceneRef.current) {
      // @ts-ignore
      rendererRef.current.render(sceneRef.current, rendererRef.current.xr.getCamera());
    }
  };

  // Controlar a reprodução do vídeo
  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsVideoPlaying(!isVideoPlaying);
  };

  // Encerrar a sessão AR
  const endARSession = () => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end();
    }
  };

  // Voltar para a página anterior
  const handleGoBack = () => {
    if (isARSessionActive) {
      endARSession();
    }
    navigate(-1);
  };

  // Caso o QR Code ou vídeo não seja encontrado
  if (!qrCode || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">QR Code não encontrado</h1>
          <p className="mb-6">
            Não foi possível encontrar o QR Code ou vídeo associado. Verifique se o URL está correto.
          </p>
          <Button variant="outline" onClick={() => navigate("/qrcodes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para QR Codes
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar tela de carregamento
  if (loadingState === 'checking' || loadingState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">
            {loadingState === 'checking' ? 'Verificando compatibilidade' : 'Preparando AR'}
          </h1>
          
          <div className="mb-6">
            {loadingState === 'checking' ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-12 w-12 text-primary animate-spin" />
              </div>
            ) : (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-white text-xs">
                  <span>Carregando recursos AR</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-400">
            {loadingState === 'checking' 
              ? 'Verificando se seu dispositivo suporta Realidade Aumentada...'
              : 'Carregando recursos necessários para a experiência AR...'}
          </p>
          
          <div className="mt-6">
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar mensagem de erro
  if (loadingState === 'error' || !isARSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-black text-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">AR não suportado</h1>
          <p className="mb-6">
            {errorMessage || "Seu dispositivo não suporta Realidade Aumentada."}
          </p>
          <div className="flex flex-col space-y-4">
            <Button 
              variant="default" 
              onClick={() => navigate(`/qrcodes/simulate/${id}`)}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Usar simulação AR
            </Button>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Canvas para WebXR */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      
      {/* Vídeo escondido para textura */}
      <video 
        ref={videoRef} 
        className="hidden"
        playsInline
        onEnded={() => setIsVideoPlaying(false)}
        onPause={() => setIsVideoPlaying(false)}
        onPlay={() => setIsVideoPlaying(true)}
      />
      
      {/* Overlay de controles */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center items-center z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-full p-2 flex items-center space-x-3">
          <Button
            variant="outline" 
            size="icon"
            onClick={handleGoBack}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {isARSessionActive ? (
            <Button
              variant="outline" 
              size="icon"
              onClick={toggleVideoPlayback}
              className="rounded-full"
              disabled={!videoPlaneRef.current?.parent}
            >
              {isVideoPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <Button
              variant="default" 
              onClick={startARSession}
              className="rounded-full px-6"
            >
              <Camera className="mr-2 h-5 w-5" />
              Iniciar AR
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AR;
