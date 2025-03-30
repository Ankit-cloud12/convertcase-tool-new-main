import { useState } from "react";
import ImageTool from "./ImageTool";
import { saveAs } from 'file-saver';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const WebpToPngConverter = () => {
  const [quality, setQuality] = useState(90);

  const processImage = async (file: File) => {
    // Check file type
    if (!file.type.includes('webp')) {
      throw new Error('Please upload a WebP image');
    }

    return new Promise<any>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = function(e) {
        if (!e.target?.result) {
          reject(new Error('Failed to read the file'));
          return;
        }
        
        img.src = e.target.result as string;
        
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }
          
          // Draw image with transparent background (PNG supports transparency)
          ctx.drawImage(img, 0, 0);
          
          // Convert to PNG
          try {
            const pngQuality = quality / 100;
            const pngDataUrl = canvas.toDataURL('image/png', pngQuality);
            
            // Get file size
            const pngBlob = dataURLToBlob(pngDataUrl);
            
            resolve({
              originalSize: file.size,
              convertedSize: pngBlob.size,
              dataUrl: pngDataUrl,
              blob: pngBlob,
              width: img.width,
              height: img.height,
              filename: file.name.replace(/\.[^/.]+$/, "") + '.png'
            });
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = function() {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Helper to convert data URL to Blob
  const dataURLToBlob = (dataURL: string) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(raw.length);
    
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  };

  const renderResult = (result: any) => {
    const sizeReduction = ((result.originalSize - result.convertedSize) / result.originalSize * 100).toFixed(2);
    
    return (
      <div className="flex flex-col h-full">
        <div className="bg-zinc-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium mb-2">Conversion Result</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-300">Original WebP</h4>
              <p className="text-sm text-gray-400">Size: {(result.originalSize / 1024).toFixed(2)} KB</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-300">Converted PNG</h4>
              <p className="text-sm text-gray-400">Size: {(result.convertedSize / 1024).toFixed(2)} KB</p>
              {Number(sizeReduction) > 0 ? (
                <p className="text-sm text-green-400">
                  {sizeReduction}% smaller
                </p>
              ) : Number(sizeReduction) < 0 ? (
                <p className="text-sm text-yellow-400">
                  {Math.abs(Number(sizeReduction)).toFixed(2)}% larger
                </p>
              ) : null}
              <p className="text-sm text-gray-400">Dimensions: {result.width} x {result.height}px</p>
            </div>
          </div>
          <div className="bg-zinc-800 rounded p-2">
            <img 
              src={result.dataUrl} 
              alt="Converted" 
              className="max-h-[300px] w-auto mx-auto object-contain"
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-auto">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => saveAs(result.blob, result.filename)}
          >
            Download PNG
          </Button>
        </div>
      </div>
    );
  };

  const options = (
    <div>
      <label className="text-sm text-white block mb-2">
        PNG Quality: {quality}%
      </label>
      <div className="mb-2 text-xs text-gray-400">
        PNG is a lossless format, but quality can affect compression level.
      </div>
      <Slider 
        value={[quality]} 
        min={10} 
        max={100} 
        step={1} 
        onValueChange={(value) => setQuality(value[0])} 
      />
    </div>
  );

  return (
    <ImageTool
      title="WebP to PNG Converter"
      description="Convert WebP images to PNG format online, for free. PNG preserves transparency and provides lossless compression, making it ideal for graphics, logos, and images that need high quality."
      processImage={processImage}
      renderResult={renderResult}
      options={options}
      acceptedFileTypes={{
        'image/webp': []
      }}
    />
  );
};

export default WebpToPngConverter;
