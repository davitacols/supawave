package com.supawave.pos;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private HardwareManager hardwareManager;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        hardwareManager = new HardwareManager(this);

        // Configure WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Enable cookies for login
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }
        android.webkit.CookieManager.getInstance().setAcceptCookie(true);

        // Add JavaScript interface
        webView.addJavascriptInterface(new AndroidInterface(), "Android");

        // Set WebView client
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // Initialize offline POS demo
                String initScript = 
                    "(function() {" +
                    "  console.log('SupaWave POS Demo Initialized');" +
                    "  if (window.initPOSTerminal) {" +
                    "    window.initPOSTerminal();" +
                    "  }" +
                    "})()";
                
                webView.evaluateJavascript(initScript, null);
                
                // Initialize POS if available
                webView.evaluateJavascript(
                    "if (window.initPOSTerminal) { window.initPOSTerminal(); }", 
                    null
                );
            }
        });

        // Load offline demo POS interface
        webView.loadUrl("file:///android_asset/pos.html");
    }

    public class AndroidInterface {
        @JavascriptInterface
        public void printReceipt(String content) {
            runOnUiThread(() -> {
                boolean success = hardwareManager.printReceipt(content);
                String message = success ? "Receipt printed successfully" : "Printer not available";
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
            });
        }

        @JavascriptInterface
        public void startBarcodeScanner() {
            runOnUiThread(() -> {
                hardwareManager.startBarcodeScanner(barcode -> {
                    webView.evaluateJavascript(
                        "if (window.barcodeScanner) { window.barcodeScanner.onBarcodeScanned('" + barcode + "'); }",
                        null
                    );
                });
            });
        }

        @JavascriptInterface
        public String testPrinter() {
            boolean connected = hardwareManager.testPrinter();
            return "{\"connected\": " + connected + ", \"message\": \"" + 
                   (connected ? "Printer ready" : "Printer not found") + "\"}";
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
            });
        }

        @JavascriptInterface
        public String getDeviceInfo() {
            return "{\"model\": \"" + android.os.Build.MODEL + "\", " +
                   "\"version\": \"" + android.os.Build.VERSION.RELEASE + "\", " +
                   "\"app\": \"SupaWave POS v1.0\"}";
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}