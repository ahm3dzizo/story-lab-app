import React, { useRef, useEffect } from 'react';
import { Platform } from 'react-native';

// Import native RTCView only for non-web platforms
const { RTCView: NativeRTCView } = Platform.OS !== 'web' 
  ? require('react-native-webrtc') 
  : { RTCView: null };

interface RTCViewProps {
  streamURL: any;
  style?: any;
}

// Web implementation
function WebRTCView({ streamURL, style }: RTCViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && streamURL) {
      videoRef.current.srcObject = streamURL;
    }
  }, [streamURL]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={style}
    />
  );
}

// Export appropriate implementation based on platform
export const RTCView = Platform.OS === 'web' ? WebRTCView : NativeRTCView;
