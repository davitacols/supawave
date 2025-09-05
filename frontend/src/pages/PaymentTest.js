import React from 'react';

const PaymentTest = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Payment Callback Test</h1>
      <p>This page is working!</p>
      <p>URL: {window.location.href}</p>
    </div>
  );
};

export default PaymentTest;