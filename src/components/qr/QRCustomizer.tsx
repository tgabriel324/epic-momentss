
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Upload } from "lucide-react";
import { useQRCodeStore, QRCode } from "@/store/qrCodeStore";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { useVideoStore } from "@/store/videoStore";

interface QRCustomizerProps {
  qrCode: QRCode;
  onClose: () => void;
}

const QRCustomizer: React.FC<QRCustomizerProps> = ({ qrCode, onClose }) => {
  const { updateQRCode } = useQRCodeStore();
  const { getVideoById } = useVideoStore();
  const video = getVideoById(qrCode.videoId);
  
  const [qrStyle, setQrStyle] = useState(qrCode.style);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(qrCode.style.logoUrl);
  
  // Atualizar o estilo do QR code
  const handleStyleChange = (key: keyof typeof qrStyle, value: any) => {
    setQrStyle(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Processar o upload de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setLogoPreview(e.target.result);
          handleStyleChange('logoUrl', e.target.result);
        }
      };
      
      reader.readAsDataURL(file);
      setLogoFile(file);
    }
  };
  
  // Remover o logo
  const handleRemoveLogo = () => {
    setLogoPreview(undefined);
    handleStyleChange('logoUrl', undefined);
    setLogoFile(null);
  };
  
  // Salvar as alterações
  const handleSave = () => {
    updateQRCode(qrCode.id, {
      style: qrStyle
    });
    
    toast({
      title: "QR code atualizado",
      description: "As alterações foram salvas com sucesso."
    });
    
    onClose();
  };
  
  // URL única para AR (simulada)
  const arUrl = `https://epicmoments.app/ar/${qrCode.id}`;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">{qrCode.videoTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Personalize a aparência do seu QR code
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qrSize">Tamanho ({qrStyle.size}px)</Label>
                <Slider 
                  id="qrSize"
                  min={100} 
                  max={300} 
                  step={10}
                  value={[qrStyle.size]} 
                  onValueChange={(values) => handleStyleChange('size', values[0])} 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="qrForeground">Cor do QR code</Label>
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input
                      id="qrForeground"
                      type="text"
                      value={qrStyle.foreground}
                      onChange={(e) => handleStyleChange('foreground', e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                  <div>
                    <Input
                      type="color"
                      value={qrStyle.foreground}
                      onChange={(e) => handleStyleChange('foreground', e.target.value)}
                      className="w-10 h-10 p-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="qrBackground">Cor de fundo</Label>
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input
                      id="qrBackground"
                      type="text"
                      value={qrStyle.background}
                      onChange={(e) => handleStyleChange('background', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                  <div>
                    <Input
                      type="color"
                      value={qrStyle.background}
                      onChange={(e) => handleStyleChange('background', e.target.value)}
                      className="w-10 h-10 p-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="qrCornerRadius">Arredondamento de cantos ({qrStyle.cornerRadius}px)</Label>
                <Slider 
                  id="qrCornerRadius"
                  min={0} 
                  max={20} 
                  step={1}
                  value={[qrStyle.cornerRadius]} 
                  onValueChange={(values) => handleStyleChange('cornerRadius', values[0])} 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="logoUpload">Logo (opcional)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('logoUpload')?.click()}
                      className="flex-grow"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {logoPreview ? "Trocar logo" : "Adicionar logo"}
                    </Button>
                    {logoPreview && (
                      <Button 
                        variant="outline" 
                        onClick={handleRemoveLogo}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  {logoPreview && (
                    <div className="mt-2 flex justify-center">
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className="w-16 h-16 object-contain border rounded p-1" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              background: qrStyle.background, 
              borderRadius: `${qrStyle.cornerRadius * 0.5}px` 
            }}
          >
            <QRCodeSVG
              value={arUrl}
              size={qrStyle.size}
              fgColor={qrStyle.foreground}
              bgColor={qrStyle.background}
              level="H"
              includeMargin={true}
              imageSettings={logoPreview ? {
                src: logoPreview,
                height: 24,
                width: 24,
                excavate: true,
              } : undefined}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave}>
          <Check className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default QRCustomizer;
