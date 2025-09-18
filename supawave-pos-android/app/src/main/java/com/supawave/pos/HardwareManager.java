package com.supawave.pos;

import android.content.Context;
import android.content.Intent;
import android.widget.Toast;
import java.util.Random;

public class HardwareManager {
    private Context context;
    private boolean printerConnected = false;
    private BarcodeCallback barcodeCallback;

    public interface BarcodeCallback {
        void onBarcodeScanned(String barcode);
    }

    public HardwareManager(Context context) {
        this.context = context;
        // Simulate printer detection
        this.printerConnected = new Random().nextBoolean();
    }

    public boolean printReceipt(String content) {
        if (!printerConnected) {
            Toast.makeText(context, "Printer not connected", Toast.LENGTH_SHORT).show();
            return false;
        }

        // Simulate printing delay
        new Thread(() -> {
            try {
                Thread.sleep(2000); // 2 second print simulation
                ((MainActivity) context).runOnUiThread(() -> {
                    Toast.makeText(context, "Receipt printed!", Toast.LENGTH_SHORT).show();
                });
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        return true;
    }

    public void startBarcodeScanner(BarcodeCallback callback) {
        this.barcodeCallback = callback;
        
        // For demo: simulate barcode scanning
        Toast.makeText(context, "Barcode scanner started", Toast.LENGTH_SHORT).show();
        
        // Simulate barcode detection after 3 seconds
        new Thread(() -> {
            try {
                Thread.sleep(3000);
                String[] demoBarcodes = {
                    "1234567890123",
                    "9876543210987",
                    "5555666677778",
                    "1111222233334"
                };
                String randomBarcode = demoBarcodes[new Random().nextInt(demoBarcodes.length)];
                
                if (barcodeCallback != null) {
                    ((MainActivity) context).runOnUiThread(() -> {
                        barcodeCallback.onBarcodeScanned(randomBarcode);
                        Toast.makeText(context, "Barcode scanned: " + randomBarcode, Toast.LENGTH_SHORT).show();
                    });
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }

    public boolean testPrinter() {
        // Simulate printer test
        if (printerConnected) {
            Toast.makeText(context, "Printer test successful", Toast.LENGTH_SHORT).show();
            return true;
        } else {
            Toast.makeText(context, "Printer not found", Toast.LENGTH_SHORT).show();
            return false;
        }
    }

    public boolean isPrinterConnected() {
        return printerConnected;
    }

    public void setPrinterConnected(boolean connected) {
        this.printerConnected = connected;
    }
}