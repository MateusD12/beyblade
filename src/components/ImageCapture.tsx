import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';

interface ImageCaptureProps {
  onImageCapture: (imageBase64: string) => void;
  disabled?: boolean;
}

export function ImageCapture({ onImageCapture, disabled }: ImageCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Não foi possível acessar a câmera. Por favor, permita o acesso ou use o upload de arquivo.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(imageData);
      stopCamera();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (preview) {
      onImageCapture(preview);
    }
  };

  const handleReset = () => {
    setPreview(null);
    stopCamera();
  };

  if (showCamera) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full aspect-square object-cover"
        />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          <Button 
            variant="destructive" 
            size="icon" 
            onClick={stopCamera}
            className="rounded-full w-12 h-12"
          >
            <X className="w-6 h-6" />
          </Button>
          <Button 
            size="icon" 
            onClick={capturePhoto}
            className="rounded-full w-16 h-16 bg-white hover:bg-gray-100"
          >
            <div className="w-12 h-12 rounded-full border-4 border-primary" />
          </Button>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full aspect-square object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3 rounded-full"
            onClick={handleReset}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Tirar Outra
          </Button>
          <Button 
            className="flex-1"
            onClick={handleConfirm}
            disabled={disabled}
          >
            Identificar Beyblade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 flex flex-col items-center justify-center aspect-square bg-muted/30">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Camera className="w-10 h-10 text-primary" />
        </div>
        <p className="text-center text-muted-foreground mb-4">
          Tire uma foto ou faça upload da sua Beyblade
        </p>
      </div>
      
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={startCamera}
        >
          <Camera className="w-4 h-4 mr-2" />
          Câmera
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
