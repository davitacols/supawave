class BarcodeScanner {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.isScanning = false;
    this.scanCallback = null;
  }

  // Start barcode scanning
  async startScan(callback) {
    this.scanCallback = callback;
    this.isScanning = true;

    if (this.isAndroid && window.Android) {
      // Android native scanner
      try {
        await window.Android.startBarcodeScanner();
        return { success: true, message: 'Scanner started' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Web camera scanner fallback
      return this.startWebScanner();
    }
  }

  // Stop scanning
  stopScan() {
    this.isScanning = false;
    this.scanCallback = null;

    if (this.isAndroid && window.Android) {
      window.Android.stopBarcodeScanner();
    } else {
      this.stopWebScanner();
    }
  }

  // Handle scanned barcode (called from Android)
  onBarcodeScanned(barcode) {
    if (this.scanCallback && this.isScanning) {
      this.scanCallback(barcode);
    }
  }

  // Web camera scanner implementation
  async startWebScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Create video element for camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Create scanner overlay
      const overlay = this.createScannerOverlay(video);
      document.body.appendChild(overlay);

      // Start scanning loop
      this.scanFromVideo(video);

      return { success: true, message: 'Web scanner started' };
    } catch (error) {
      return { success: false, error: 'Camera access denied' };
    }
  }

  createScannerOverlay(video) {
    const overlay = document.createElement('div');
    overlay.id = 'scanner-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    video.style.cssText = `
      width: 90%;
      max-width: 400px;
      height: auto;
      border: 2px solid #00ff00;
    `;

    const instructions = document.createElement('div');
    instructions.textContent = 'Point camera at barcode';
    instructions.style.cssText = `
      color: white;
      font-size: 18px;
      margin-bottom: 20px;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Scanner';
    closeBtn.style.cssText = `
      margin-top: 20px;
      padding: 10px 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
    `;
    closeBtn.onclick = () => this.stopScan();

    overlay.appendChild(instructions);
    overlay.appendChild(video);
    overlay.appendChild(closeBtn);

    return overlay;
  }

  scanFromVideo(video) {
    if (!this.isScanning) return;

    // Simulate barcode detection (in real implementation, use a library like QuaggaJS)
    setTimeout(() => {
      if (this.isScanning) {
        // Mock barcode for demo
        const mockBarcode = '1234567890123';
        if (Math.random() > 0.7) { // 30% chance to "detect" barcode
          this.onBarcodeScanned(mockBarcode);
          this.stopScan();
        } else {
          this.scanFromVideo(video);
        }
      }
    }, 1000);
  }

  stopWebScanner() {
    const overlay = document.getElementById('scanner-overlay');
    if (overlay) {
      // Stop video stream
      const video = overlay.querySelector('video');
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      overlay.remove();
    }
  }

  // Manual barcode entry
  showManualEntry(callback) {
    const barcode = prompt('Enter barcode manually:');
    if (barcode && callback) {
      callback(barcode);
    }
  }

  // Get scanner status
  getScannerStatus() {
    return {
      isScanning: this.isScanning,
      platform: this.isAndroid ? 'Android' : 'Web',
      hasAndroidInterface: !!(this.isAndroid && window.Android),
      hasCameraAccess: !!navigator.mediaDevices?.getUserMedia
    };
  }
}

// Make scanner available globally for Android callbacks
window.barcodeScanner = new BarcodeScanner();

export default BarcodeScanner;