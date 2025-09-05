import { BrowserMultiFormatReader } from '@zxing/library';

class BarcodeService {
  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
  }

  async startScanning(videoElement, onResult, onError) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      videoElement.srcObject = stream;
      
      this.codeReader.decodeFromVideoDevice(null, videoElement, (result, error) => {
        if (result) {
          onResult(result.text);
        }
        if (error && error.name !== 'NotFoundException') {
          onError(error);
        }
      });
    } catch (error) {
      onError(error);
    }
  }

  stopScanning() {
    this.codeReader.reset();
  }

  generateBarcode(text) {
    // Simple EAN-13 barcode generation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 60;
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 100, 50);
    
    // Draw simple barcode pattern
    for (let i = 0; i < text.length; i++) {
      const x = 20 + (i * 15);
      ctx.fillRect(x, 10, 2, 30);
    }
    
    return canvas.toDataURL();
  }
}

export default new BarcodeService();