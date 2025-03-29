/**
 * WebRTC utility file
 * 
 * This file provides a platform-specific import for WebRTC functionality
 */

import { Platform, View as RNView } from 'react-native';
import type { Component } from 'react';

// Define types for our WebRTC components
export interface RTCViewProps {
  streamURL: string;
  style?: any;
  [key: string]: any;
}

export interface RTCPeerConnectionConfig {
  iceServers: Array<{ urls: string | string[] }>;
}

export interface RTCIceCandidateInit {
  candidate: string;
  sdpMLineIndex?: number;
  sdpMid?: string;
}

export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp: string;
}

// Import WebRTC components based on platform
let RTCView: React.ForwardRefExoticComponent<RTCViewProps & React.RefAttributes<any>>;
let RTCPeerConnection: new (configuration: RTCPeerConnectionConfig) => any;
let mediaDevices: {
  getUserMedia: (constraints: { video?: boolean; audio?: boolean }) => Promise<any>;
  getDisplayMedia?: (constraints: { video?: boolean; audio?: boolean }) => Promise<any>;
  enumerateDevices?: () => Promise<any[]>;
};
let RTCIceCandidate: new (candidate: RTCIceCandidateInit) => any;
let RTCSessionDescription: new (description: RTCSessionDescriptionInit) => any;

// Use try-catch to handle potential errors when importing WebRTC
try {
  if (Platform.OS === 'web') {
    // On web, use our shims
    console.log('🌐 Using WebRTC web shims');
    const WebRTC = require('../shim/react-native-webrtc');
    RTCView = WebRTC.RTCView;
    RTCPeerConnection = WebRTC.RTCPeerConnection;
    mediaDevices = WebRTC.mediaDevices;
    RTCIceCandidate = WebRTC.RTCIceCandidate;
    RTCSessionDescription = WebRTC.RTCSessionDescription;
  } else {
    // On native platforms, try to use the real implementation
    console.log('📱 Attempting to use native WebRTC implementation');
    try {
      // First try to dynamically require the module
      const WebRTC = require('react-native-webrtc');
      
      // Check if the module has the expected components
      if (!WebRTC.RTCView || !WebRTC.RTCPeerConnection) {
        throw new Error('WebRTC module is missing required components');
      }
      
      console.log('✅ Successfully loaded native WebRTC module');
      RTCView = WebRTC.RTCView;
      RTCPeerConnection = WebRTC.RTCPeerConnection;
      mediaDevices = WebRTC.mediaDevices;
      RTCIceCandidate = WebRTC.RTCIceCandidate;
      RTCSessionDescription = WebRTC.RTCSessionDescription;
    } catch (error) {
      console.warn('⚠️ Failed to load native WebRTC module, falling back to shims', error);
      // Fall back to shims if native module fails to load
      console.log('🔄 Loading WebRTC shims as fallback');
      const WebRTC = require('../shim/react-native-webrtc');
      RTCView = WebRTC.RTCView;
      RTCPeerConnection = WebRTC.RTCPeerConnection;
      mediaDevices = WebRTC.mediaDevices;
      RTCIceCandidate = WebRTC.RTCIceCandidate;
      RTCSessionDescription = WebRTC.RTCSessionDescription;
    }
  }
} catch (error) {
  console.error('❌ Error loading WebRTC modules:', error);
  // We already imported RNView at the top, so no need to require it again
  const React = require('react');
  
  // Create minimal fallback implementations
  console.log('🚨 Creating emergency fallback WebRTC implementations');
  
  RTCView = React.forwardRef((props: any, ref: any) => {
    console.warn('⚠️ Using emergency fallback RTCView');
    return React.createElement(RNView, { 
      ...props, 
      ref, 
      style: [
        { 
          backgroundColor: '#FF5252', 
          minHeight: 100, 
          minWidth: 100,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          padding: 16
        }, 
        props.style
      ] 
    });
  });
  
  RTCPeerConnection = class {
    constructor() {
      console.warn('⚠️ Using emergency fallback RTCPeerConnection');
    }
    addTrack() { return {}; }
    createOffer() { return Promise.resolve({}); }
    createAnswer() { return Promise.resolve({}); }
    setLocalDescription() { return Promise.resolve(); }
    setRemoteDescription() { return Promise.resolve(); }
    close() {}
  };
  
  mediaDevices = {
    getUserMedia: (constraints) => {
      console.warn('⚠️ Using emergency fallback getUserMedia', constraints);
      return Promise.reject(new Error('getUserMedia not available - WebRTC module failed to load'));
    },
    enumerateDevices: () => {
      console.warn('⚠️ Using emergency fallback enumerateDevices');
      return Promise.resolve([]);
    }
  };
  
  RTCIceCandidate = class {
    constructor(candidate: any) {
      console.warn('⚠️ Using emergency fallback RTCIceCandidate');
      Object.assign(this, candidate);
    }
  };
  
  RTCSessionDescription = class {
    constructor(description: any) {
      console.warn('⚠️ Using emergency fallback RTCSessionDescription');
      Object.assign(this, description);
    }
  };
}

// Export the components
export {
  RTCView,
  RTCPeerConnection,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription
}; 