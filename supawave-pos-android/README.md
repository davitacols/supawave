# SupaWave POS Android App

📱 **Android WebView container for SupaWave POS system**

## Features

### 🌐 **WebView Integration**
- Loads SupaWave POS web interface
- Full-screen landscape mode
- JavaScript enabled with native bridge

### 🔌 **Hardware Integration**
- **Thermal Printer**: Bluetooth receipt printing
- **Barcode Scanner**: Camera + hardware scanner support
- **Native Interfaces**: JavaScript ↔ Android communication

### 📱 **Android Interfaces**

#### **JavaScript → Android**
```javascript
// Print receipt
window.Android.printReceipt(receiptContent);

// Start barcode scanner
window.Android.startBarcodeScanner();

// Test printer connection
window.Android.testPrinter();

// Show Android toast
window.Android.showToast("Message");

// Get device info
window.Android.getDeviceInfo();
```

#### **Android → JavaScript**
```javascript
// Barcode scanned callback
window.barcodeScanner.onBarcodeScanned(barcode);

// Initialize POS terminal
window.initPOSTerminal();
```

## Build Instructions

### **Prerequisites**
- Android Studio Arctic Fox or later
- Android SDK 24+ (Android 7.0)
- Java 8+

### **Build Steps**
```bash
# Open in Android Studio
# File → Open → supawave-pos-android

# Build APK
./gradlew assembleDebug

# Install on device
./gradlew installDebug
```

### **APK Location**
```
app/build/outputs/apk/debug/app-debug.apk
```

## Hardware Setup

### **Recommended Hardware**
- **Tablet**: 10" Android tablet (Samsung Galaxy Tab A)
- **Printer**: Bluetooth thermal printer (58mm/80mm)
- **Scanner**: USB/Bluetooth barcode scanner
- **Stand**: Tablet stand with cable management

### **Printer Integration**
```java
// HardwareManager.java handles:
// - Bluetooth printer connection
// - Receipt formatting
// - Print job management
```

### **Scanner Integration**
```java
// Barcode scanning methods:
// - Camera-based scanning
// - Hardware scanner input
// - Manual barcode entry
```

## Demo Mode

### **Simulated Hardware**
- **Printer**: Random connection status
- **Scanner**: Generates demo barcodes after 3 seconds
- **Receipts**: Shows print simulation with toast messages

### **Demo Barcodes**
- `1234567890123`
- `9876543210987`
- `5555666677778`
- `1111222233334`

## Deployment

### **Development**
```bash
# Connect Android device via USB
# Enable Developer Options + USB Debugging
adb install app-debug.apk
```

### **Production**
```bash
# Generate signed APK
# Build → Generate Signed Bundle/APK
# Upload to Google Play Store
```

## Pesapal Integration

### **Payment Flow**
1. Complete sale in POS interface
2. Select "Mobile Money" payment
3. Pesapal payment gateway opens
4. Customer completes payment
5. Receipt prints automatically

### **Required Updates**
- Add Pesapal SDK dependency
- Implement payment callbacks
- Handle payment verification

## Next Steps

1. **Real Hardware Testing**
   - Connect Bluetooth thermal printer
   - Test barcode scanner integration
   - Verify receipt printing

2. **Pesapal Integration**
   - Add payment SDK
   - Implement payment flow
   - Test with real transactions

3. **Production Deployment**
   - Code signing
   - Play Store submission
   - Device provisioning