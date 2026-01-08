import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Camera, Upload, RotateCcw, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  onImageCropped: (croppedImageUrl: string) => void;
  currentImage?: string;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ onImageCropped, currentImage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState(300);
  const [zoom, setZoom] = useState([100]);
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateMaxCropSize = (imageWidth: number, imageHeight: number) => {
    // The maximum circle size is limited by the smaller dimension at 100% zoom
    return Math.min(imageWidth, imageHeight);
  };

  // Update crop size and position when zoom changes
  useEffect(() => {
    if (imageRef.current && originalImageDimensions.width && originalImageDimensions.height) {
      const baseMaxSize = calculateMaxCropSize(
        originalImageDimensions.width, 
        originalImageDimensions.height
      );
      
      // At higher zoom levels, we can use a larger crop size since we're zooming into the image
      // But we need to ensure it doesn't exceed the base image dimensions
      const zoomFactor = zoom[0] / 100;
      const adjustedMaxSize = Math.min(baseMaxSize, baseMaxSize * zoomFactor);
      setCropSize(adjustedMaxSize);
      
      // Recenter the crop position within the actual image bounds
      setCropPosition({
        x: Math.max(0, (originalImageDimensions.width - adjustedMaxSize) / 2),
        y: Math.max(0, (originalImageDimensions.height - adjustedMaxSize) / 2)
      });
    }
  }, [zoom, originalImageDimensions]);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelectedImage(imageUrl);
        setIsOpen(true);
        setZoom([100]);
        
        // Calculate maximum crop size and center the circle when new image is loaded
        setTimeout(() => {
          if (imageRef.current) {
            const img = imageRef.current;
            const dimensions = { width: img.clientWidth, height: img.clientHeight };
            setOriginalImageDimensions(dimensions);
            
            const maxSize = calculateMaxCropSize(dimensions.width, dimensions.height);
            setCropSize(maxSize);
            setCropPosition({
              x: Math.max(0, (dimensions.width - maxSize) / 2),
              y: Math.max(0, (dimensions.height - maxSize) / 2)
            });
          }
        }, 100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate the offset from the mouse position to the crop circle's center
    const circleX = cropPosition.x + cropSize / 2;
    const circleY = cropPosition.y + cropSize / 2;
    const offsetX = e.clientX - rect.left - circleX;
    const offsetY = e.clientY - rect.top - circleY;
    
    setDragStartPos({ x: offsetX, y: offsetY });
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current) return;
      
      const rect = imageRef.current.getBoundingClientRect();
      
      // Calculate new center position
      const newCenterX = moveEvent.clientX - rect.left - dragStartPos.x;
      const newCenterY = moveEvent.clientY - rect.top - dragStartPos.y;
      
      // Convert to top-left position
      const newX = newCenterX - cropSize / 2;
      const newY = newCenterY - cropSize / 2;
      
      // Calculate boundaries - ensure the circle stays within the original image bounds
      // regardless of zoom level
      const maxX = Math.max(0, originalImageDimensions.width - cropSize);
      const maxY = Math.max(0, originalImageDimensions.height - cropSize);
      
      setCropPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const cropImage = useCallback(() => {
    if (!selectedImage || !imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const imageElement = imageRef.current!;
      const rect = imageElement.getBoundingClientRect();
      
      // Calculate scale factors with zoom
      const zoomFactor = zoom[0] / 100;
      const baseScaleX = img.naturalWidth / imageElement.clientWidth;
      const baseScaleY = img.naturalHeight / imageElement.clientHeight;
      const scaleX = baseScaleX / zoomFactor;
      const scaleY = baseScaleY / zoomFactor;
      
      // Set canvas size to crop size
      canvas.width = cropSize;
      canvas.height = cropSize;
      
      // Calculate source coordinates with zoom adjustment
      const sourceSize = cropSize * Math.min(scaleX, scaleY);
      const sourceX = (cropPosition.x * baseScaleX) + (img.naturalWidth - sourceSize) / 2;
      const sourceY = (cropPosition.y * baseScaleY) + (img.naturalHeight - sourceSize) / 2;
      
      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.clip();
      
      // Draw the cropped image
      ctx.drawImage(
        img,
        Math.max(0, sourceX), Math.max(0, sourceY), sourceSize, sourceSize,
        0, 0, cropSize, cropSize
      );
      
      ctx.restore();
      
      // Convert canvas to data URL (base64)
      const croppedUrl = canvas.toDataURL('image/png', 0.8);
      onImageCropped(croppedUrl);
      setIsOpen(false);
      setSelectedImage(null);
    };
    img.src = selectedImage;
  }, [selectedImage, cropPosition, cropSize, zoom, onImageCropped]);

  const imageStyle = {
    transform: `scale(${zoom[0] / 100})`,
    transformOrigin: 'center center'
  };

  return (
    <>
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-emerald-200 hover:border-emerald-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {currentImage ? (
          <div className="flex flex-col items-center space-y-2">
            <img
              src={currentImage}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"
            />
            <span className="text-sm text-emerald-600">Click to change photo</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Camera className="h-8 w-8 text-emerald-400" />
            <span className="text-sm text-emerald-600">
              Click to upload or drag and drop your photo
            </span>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Profile Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedImage && (
              <>
                <div className="relative inline-block overflow-hidden rounded-lg">
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Crop preview"
                    className="max-w-full max-h-96 object-contain transition-transform duration-200 select-none"
                    style={{ ...imageStyle, maxHeight: '400px' }}
                    draggable={false}
                  />
                  
                  {/* Crop circle overlay */}
                  <div
                    className={`absolute border-4 border-emerald-500 rounded-full bg-transparent select-none ${
                      isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    style={{
                      left: cropPosition.x,
                      top: cropPosition.y,
                      width: cropSize,
                      height: cropSize,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        Drag to adjust
                      </span>
                    </div>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <ZoomIn className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-700 min-w-[50px]">Zoom</span>
                    <div className="flex-1">
                      <Slider
                        value={zoom}
                        onValueChange={setZoom}
                        max={200}
                        min={100}
                        step={10}
                        className="w-full"
                      />
                    </div>
                    <span className="text-sm text-gray-500 min-w-[40px]">{zoom[0]}%</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Adjust zoom to include more or less of the original image
                  </p>
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedImage(null);
                  setZoom([100]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={cropImage}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Crop & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};

export default ImageCropper; 