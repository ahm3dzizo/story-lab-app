// بديل محسن لوحدة ws
class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 1; // OPEN state instead of CLOSED
    this.listeners = {};
    
    // إرسال حدث اتصال بمجرد الإنشاء
    setTimeout(() => {
      this.emit('open');
      
      // إرسال حدث ping كل 30 ثانية لمحاكاة الاتصال المستمر
      this.pingInterval = setInterval(() => {
        this.emit('ping');
      }, 30000);
    }, 100);
    
    console.log(`[MockWebSocket] Created connection to ${url}`);
  }
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }
  
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
    return true;
  }
  
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
  
  addEventListener(event, callback) {
    return this.on(event, callback);
  }
  
  send(data) {
    // محاكاة معالجة الطلب
    console.log(`[MockWebSocket] Sent data: ${typeof data === 'string' ? data.slice(0, 50) + '...' : 'binary data'}`);
    
    // إرسال استجابة وهمية بعد تأخير قصير
    setTimeout(() => {
      this.emit('message', {
        data: JSON.stringify({ type: 'response', success: true })
      });
    }, 100);
  }
  
  close() {
    // تنظيف الفواصل الزمنية عند الإغلاق
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.readyState = 3; // CLOSED
    this.emit('close', 1000, 'Connection closed normally');
    console.log(`[MockWebSocket] Closed connection to ${this.url}`);
  }
}

// حالات WebSocket
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

// تصدير الفئة الرئيسية
module.exports = MockWebSocket;
module.exports.WebSocket = MockWebSocket; 