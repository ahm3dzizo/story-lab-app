/**
 * Shim for react-native-webrtc package in web environment
 */

import React from 'react';
import { View } from 'react-native';
import RTCView, { RTCViewProps } from './RTCView';

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

// Mock components and functions
class RTCPeerConnection {
  constructor(configuration: RTCPeerConnectionConfig) {
    console.warn('🔌 RTCPeerConnection is not fully implemented in web environment');
  }
  
  // Add mock methods as needed
  addTrack(track: any, stream: any): any { return {}; }
  createOffer(): Promise<any> { return Promise.resolve({}); }
  createAnswer(): Promise<any> { return Promise.resolve({}); }
  setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> { return Promise.resolve(); }
  setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> { return Promise.resolve(); }
  close(): void {}
}

class RTCIceCandidate {
  candidate: string;
  sdpMLineIndex?: number;
  sdpMid?: string;

  constructor(candidate: RTCIceCandidateInit) {
    console.warn('❄️ RTCIceCandidate is not fully implemented in web environment');
    this.candidate = candidate.candidate;
    this.sdpMLineIndex = candidate.sdpMLineIndex;
    this.sdpMid = candidate.sdpMid;
  }
}

class RTCSessionDescription {
  type: string;
  sdp: string;

  constructor(description: RTCSessionDescriptionInit) {
    console.warn('📝 RTCSessionDescription is not fully implemented in web environment');
    this.type = description.type;
    this.sdp = description.sdp;
  }
}

const mediaDevices = {
  getUserMedia: (constraints: { video?: boolean; audio?: boolean }): Promise<any> => {
    console.warn('📵 getUserMedia is not implemented in this web environment');
    // Log what was requested
    if (constraints.video) console.log('📹 Video was requested');
    if (constraints.audio) console.log('🎤 Audio was requested');
    
    return Promise.reject(new Error('getUserMedia is not implemented in web environment'));
  },
  getDisplayMedia: (constraints: { video?: boolean; audio?: boolean }): Promise<any> => {
    console.warn('🖥️ getDisplayMedia is not implemented in this web environment');
    // Log what was requested
    if (constraints.video) console.log('📹 Video was requested');
    if (constraints.audio) console.log('🎤 Audio was requested');
    
    return Promise.reject(new Error('getDisplayMedia is not implemented in web environment'));
  },
  enumerateDevices: (): Promise<any[]> => {
    console.warn('🔍 enumerateDevices is not implemented in this web environment');
    return Promise.resolve([]);
  }
};

// Create a placeholder component for RTCPIPView
const RTCPIPView = React.forwardRef<View, RTCViewProps>((props, ref) => {
  // Add custom props to show it's a PIP view
  const pipProps = {
    ...props,
    style: [
      { 
        borderWidth: 2,
        borderColor: '#3498db',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }, 
      props.style
    ]
  };
  
  return <RTCView ref={ref} {...pipProps} />;
});

// Mock functions for PIP
const startIOSPIP = (ref: React.RefObject<any>): void => {
  console.warn('📱 ➡️ 🖼️ startIOSPIP is not implemented in web environment');
};

const stopIOSPIP = (ref: React.RefObject<any>): void => {
  console.warn('🖼️ ➡️ 📱 stopIOSPIP is not implemented in web environment');
};

// Export all the mocked components and functions
export {
  RTCView,
  RTCPIPView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  startIOSPIP,
  stopIOSPIP
}; 