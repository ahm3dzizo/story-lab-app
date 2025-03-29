// بديل لوحدة buffer
class MockBuffer {
  constructor(input, encoding) {
    if (typeof input === 'number') {
      this._data = new Uint8Array(input);
      this.length = input;
    } else if (typeof input === 'string') {
      this._data = new TextEncoder().encode(input);
      this.length = this._data.length;
    } else if (input instanceof Uint8Array) {
      this._data = input;
      this.length = input.length;
    } else {
      this._data = new Uint8Array(0);
      this.length = 0;
    }
  }
  
  toString(encoding = 'utf8') {
    return new TextDecoder('utf-8').decode(this._data);
  }
  
  static from(input, encoding) {
    return new MockBuffer(input, encoding);
  }
  
  static alloc(size, fill = 0) {
    const buffer = new MockBuffer(size);
    if (fill !== 0) {
      const fillBuffer = typeof fill === 'string' 
        ? new TextEncoder().encode(fill)
        : new Uint8Array(1).fill(fill);
      
      for (let i = 0; i < size; i++) {
        buffer._data[i] = fillBuffer[i % fillBuffer.length];
      }
    }
    return buffer;
  }
  
  static concat(buffers) {
    const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buf of buffers) {
      result.set(buf._data, offset);
      offset += buf.length;
    }
    
    return new MockBuffer(result);
  }
}

// تصدير الفئة الرئيسية
module.exports = {
  Buffer: MockBuffer,
  SlowBuffer: MockBuffer,
  INSPECT_MAX_BYTES: 50
}; 