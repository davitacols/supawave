class ReceiptPrinter {
  constructor() {
    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.printerConnected = false;
  }

  // Generate receipt content
  generateReceipt(sale, business) {
    const receipt = {
      header: this.formatHeader(business),
      items: this.formatItems(sale.items),
      totals: this.formatTotals(sale),
      footer: this.formatFooter(business),
      timestamp: new Date().toLocaleString()
    };

    return this.formatForPrinter(receipt);
  }

  formatHeader(business) {
    return [
      '================================',
      `        ${business.name}`,
      `     ${business.address || ''}`,
      `    Tel: ${business.phone || ''}`,
      '================================',
      ''
    ].join('\n');
  }

  formatItems(items) {
    let itemText = 'ITEM                QTY   PRICE\n';
    itemText += '--------------------------------\n';
    
    items.forEach(item => {
      const name = item.name.substring(0, 16).padEnd(16);
      const qty = item.quantity.toString().padStart(3);
      const price = `₦${item.unit_price}`.padStart(8);
      itemText += `${name} ${qty}   ${price}\n`;
    });
    
    return itemText;
  }

  formatTotals(sale) {
    return [
      '--------------------------------',
      `SUBTOTAL:           ₦${sale.subtotal || sale.total_amount}`,
      `TAX:                ₦${sale.tax || '0.00'}`,
      `TOTAL:              ₦${sale.total_amount}`,
      '================================',
      ''
    ].join('\n');
  }

  formatFooter(business) {
    return [
      'Thank you for shopping with us!',
      'Please keep this receipt',
      '',
      `Receipt #: ${Date.now()}`,
      `Cashier: ${business.cashier || 'POS'}`,
      '================================'
    ].join('\n');
  }

  formatForPrinter(receipt) {
    return [
      receipt.header,
      receipt.items,
      receipt.totals,
      receipt.footer
    ].join('\n');
  }

  // Print receipt
  async printReceipt(receiptContent) {
    if (this.isAndroid && window.Android) {
      // Android WebView interface
      try {
        await window.Android.printReceipt(receiptContent);
        return { success: true, message: 'Receipt printed successfully' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Web fallback - open print dialog
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      return { success: true, message: 'Print dialog opened' };
    }
  }

  // Test printer connection
  async testPrinter() {
    if (this.isAndroid && window.Android) {
      try {
        const result = await window.Android.testPrinter();
        this.printerConnected = result.connected;
        return result;
      } catch (error) {
        return { connected: false, error: error.message };
      }
    }
    return { connected: false, message: 'Printer test not available on web' };
  }

  // Get printer status
  getPrinterStatus() {
    return {
      connected: this.printerConnected,
      platform: this.isAndroid ? 'Android' : 'Web',
      hasAndroidInterface: !!(this.isAndroid && window.Android)
    };
  }
}

export default ReceiptPrinter;