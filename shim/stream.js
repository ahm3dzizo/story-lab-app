// بديل محسن لوحدة stream
class MockStream {
  constructor(options = {}) {
    this.listeners = {};
    this.paused = false;
    this.ended = false;
    this.readable = true;
    this.writable = true;
    this.data = Buffer.from([]);
    this.options = options;
    this.chunkSize = options.highWaterMark || 16 * 1024;
    
    console.log('[MockStream] Created new stream instance');
  }
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }
  
  once(event, callback) {
    const onceWrapper = (...args) => {
      this.removeListener(event, onceWrapper);
      callback.apply(this, args);
    };
    return this.on(event, onceWrapper);
  }
  
  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
    return true;
  }
  
  removeListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
  
  removeAllListeners(event) {
    if (event) {
      this.listeners[event] = [];
    } else {
      this.listeners = {};
    }
    return this;
  }
  
  pause() {
    this.paused = true;
    return this;
  }
  
  resume() {
    this.paused = false;
    this.emit('resume');
    return this;
  }
  
  pipe(destination) {
    // محاكاة متقدمة للـ pipe
    this.on('data', (chunk) => {
      const canContinue = destination.write(chunk);
      if (!canContinue) {
        this.pause();
      }
    });
    
    destination.on('drain', () => {
      this.resume();
    });
    
    this.on('end', () => {
      destination.end();
    });
    
    return destination;
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }
    
    // محاكاة الكتابة
    this.emit('data', chunk);
    
    if (typeof callback === 'function') {
      callback();
    }
    
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (chunk) {
      this.write(chunk, encoding);
    }
    
    this.ended = true;
    this.emit('end');
    
    if (typeof callback === 'function') {
      callback();
    }
    
    return this;
  }
}

// تصدير الفئات الشائعة المستخدمة من stream
module.exports = {
  Readable: MockStream,
  Writable: MockStream,
  Duplex: MockStream,
  Transform: MockStream,
  PassThrough: MockStream,
  pipeline: (...args) => {
    const streams = args.slice(0, -1);
    const callback = args[args.length - 1];
    
    let current = streams[0];
    for (let i = 1; i < streams.length; i++) {
      current = current.pipe(streams[i]);
    }
    
    if (typeof callback === 'function') {
      process.nextTick(() => callback(null));
    }
    
    return current;
  },
  finished: (stream, callback) => {
    if (stream.ended) {
      process.nextTick(() => callback(null));
      return;
    }
    
    stream.on('end', () => {
      callback(null);
    });
    
    stream.on('error', (err) => {
      callback(err);
    });
  }
}; 