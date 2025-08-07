/**
 * QRCode.js - Minimal QR Code generator
 * Based on qrcode.js library
 */
(function(global) {
  'use strict';

  var QRCode = function(element, options) {
    this.element = element;
    this.options = options || {};
    this.init();
  };

  QRCode.prototype.init = function() {
    var text = this.options.text || '';
    var width = this.options.width || 256;
    var height = this.options.height || 256;
    var colorDark = this.options.colorDark || '#000000';
    var colorLight = this.options.colorLight || '#ffffff';
    var correctLevel = this.options.correctLevel || QRCode.CorrectLevel.L;

    // Create canvas element
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    // Simple QR code generation (placeholder)
    // In a real implementation, this would generate actual QR code data
    var qrData = this.generateQRData(text, correctLevel);
    this.drawQRCode(ctx, qrData, width, height, colorDark, colorLight);

    // Clear element and append canvas
    this.element.innerHTML = '';
    this.element.appendChild(canvas);
  };

  QRCode.prototype.generateQRData = function(text, correctLevel) {
    // Simplified QR code data generation
    // This is a placeholder - in reality, this would use proper QR encoding
    var data = [];
    var size = 21; // Standard QR code size
    
    // Create a simple pattern for demonstration
    for (var i = 0; i < size; i++) {
      data[i] = [];
      for (var j = 0; j < size; j++) {
        // Create a simple pattern based on text
        var charCode = text.charCodeAt((i * size + j) % text.length) || 0;
        data[i][j] = (charCode + i + j) % 2 === 0;
      }
    }
    
    return data;
  };

  QRCode.prototype.drawQRCode = function(ctx, data, width, height, colorDark, colorLight) {
    var cellSize = Math.min(width, height) / data.length;
    
    // Fill background
    ctx.fillStyle = colorLight;
    ctx.fillRect(0, 0, width, height);
    
    // Draw QR code
    ctx.fillStyle = colorDark;
    for (var i = 0; i < data.length; i++) {
      for (var j = 0; j < data[i].length; j++) {
        if (data[i][j]) {
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  // Static properties
  QRCode.CorrectLevel = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
  };

  // Export to global scope
  global.QRCode = QRCode;

})(typeof window !== 'undefined' ? window : this); 