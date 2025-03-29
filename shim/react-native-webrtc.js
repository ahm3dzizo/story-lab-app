// Web shim for react-native-webrtc
// This provides fallback implementation for web

export const RTCPeerConnection = window.RTCPeerConnection || function() {
  console.warn('RTCPeerConnection is not fully supported in this environment');
  return {};
};

export const RTCIceCandidate = window.RTCIceCandidate || function() {
  console.warn('RTCIceCandidate is not fully supported in this environment');
  return {};
};

export const RTCSessionDescription = window.RTCSessionDescription || function() {
  console.warn('RTCSessionDescription is not fully supported in this environment');
  return {};
};

export const MediaStream = window.MediaStream || function() {
  console.warn('MediaStream is not fully supported in this environment');
  return {};
};

export const mediaDevices = window.navigator && window.navigator.mediaDevices || {
  getUserMedia: () => {
    console.warn('getUserMedia is not fully supported in this environment');
    return Promise.reject(new Error('getUserMedia is not supported'));
  }
};

// Mock the requireNativeComponent when used through react-native
export const requireNativeComponent = () => {
  console.warn('Native components not available on web');
  return 'div';  // Return a basic HTML element for web
}; 