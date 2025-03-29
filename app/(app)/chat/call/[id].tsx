import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Alert, ScrollView } from 'react-native';
import { Text, IconButton, useTheme, Chip } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  RTCPeerConnection as RTCPeerConnectionImport,
  mediaDevices as mediaDevicesImport,
  RTCIceCandidate as RTCIceCandidateImport,
  RTCSessionDescription as RTCSessionDescriptionImport,
  RTCView as RTCViewImport
} from '@/lib/webrtc';
import type { RTCPeerConnectionConfig, RTCViewProps } from '@/lib/webrtc';

// Define custom MediaStream interface to match our implementation
interface CustomMediaStream {
  _tracks: CustomMediaStreamTrack[];
  getTracks(): CustomMediaStreamTrack[];
  getAudioTracks(): CustomMediaStreamTrack[];
  getVideoTracks(): CustomMediaStreamTrack[];
  addTrack(track: CustomMediaStreamTrack): void;
  removeTrack(track: CustomMediaStreamTrack): void;
  toURL(): string;
}

// Define custom MediaStreamTrack interface
interface CustomMediaStreamTrack {
  enabled: boolean;
  stop(): void;
}

// Define types for our variables
type RTCPeerConnectionType = typeof RTCPeerConnectionImport;
type RTCPeerConnectionInstance = {
  addTrack: (track: any, stream: any) => any;
  createOffer: () => Promise<any>;
  createAnswer: () => Promise<any>;
  setLocalDescription: (description: any) => Promise<void>;
  setRemoteDescription: (description: any) => Promise<void>;
  addIceCandidate: (candidate: any) => Promise<void>;
  close: () => void;
  ontrack?: (event: { streams: any[] }) => void;
  onicecandidate?: (event: { candidate: any }) => void;
};
type MediaDevicesType = typeof mediaDevicesImport;
type RTCViewType = typeof RTCViewImport;
type RTCIceCandidateType = typeof RTCIceCandidateImport;
type RTCSessionDescriptionType = typeof RTCSessionDescriptionImport;

// Use the imported components directly
const RTCPeerConnection = RTCPeerConnectionImport;
const mediaDevices = mediaDevicesImport;
const RTCIceCandidate = RTCIceCandidateImport;
const RTCSessionDescription = RTCSessionDescriptionImport;
const RTCView = RTCViewImport;

// Create MediaStream and MediaStreamTrack classes
let MediaStream: { new(): CustomMediaStream };
let MediaStreamTrack: { new(): CustomMediaStreamTrack };

// Try to import MediaStream and MediaStreamTrack
try {
  const WebRTC = require('react-native-webrtc');
  MediaStream = WebRTC.MediaStream;
  MediaStreamTrack = WebRTC.MediaStreamTrack;
} catch (error) {
  console.warn('⚠️ Failed to load MediaStream and MediaStreamTrack, using mock implementations', error);
  // Create mock implementations
  MediaStream = class implements CustomMediaStream {
    _tracks: CustomMediaStreamTrack[] = [];
    
    constructor() {
      this._tracks = [];
      console.log('📱 Created mock MediaStream');
    }
    getTracks() { return this._tracks; }
    getAudioTracks() { return this._tracks.filter(track => true); }
    getVideoTracks() { return this._tracks.filter(track => true); }
    addTrack(track: CustomMediaStreamTrack) { this._tracks.push(track); }
    removeTrack(track: CustomMediaStreamTrack) { 
      const index = this._tracks.indexOf(track);
      if (index !== -1) this._tracks.splice(index, 1);
    }
    toURL() { return ''; }
  };
  MediaStreamTrack = class implements CustomMediaStreamTrack {
    enabled = true;
    stop() { this.enabled = false; }
  };
}

interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'initiated' | 'ongoing' | 'ended' | 'missed';
  started_at: string;
  ended_at?: string;
  room_id: string;
}

interface Participant {
  id: string;
  name: string;
  stream?: CustomMediaStream;
  connection?: RTCPeerConnectionInstance;
}

export default function CallScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const [call, setCall] = useState<Call | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<CustomMediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnectionInstance>>(new Map());
  const supabaseChannel = useRef<any>(null);

  useEffect(() => {
    // Check if this is a group call
    const params = new URLSearchParams(window.location.search);
    const isGroupParam = params.get('isGroup');
    const roomIdParam = params.get('roomId');
    
    if (isGroupParam === 'true' && roomIdParam) {
      setIsGroup(true);
      setRoomId(roomIdParam);
    }
    
    loadCall();
    setupWebRTC().catch(err => {
      console.error('Error in setupWebRTC:', err);
      setError('Failed to set up WebRTC. ' + (err.message || 'Unknown error'));
      
      // Show alert on web
      if (Platform.OS === 'web') {
        alert('WebRTC is not fully supported in web environment. Some features may not work.');
      }
    });
    
    return () => {
      cleanupWebRTC();
    };
  }, []);

  const loadCall = async () => {
    try {
      if (isGroup && roomId) {
        // For group calls, load all calls with the same room_id
        const { data, error } = await supabase
          .from('public_chat_calls')
          .select(`
            *,
            caller:users!caller_id(id, username, email),
            receiver:users!receiver_id(id, username, email)
          `)
          .eq('room_id', roomId);

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Set the first call as the main call
          setCall(data[0] as Call);
          
          // Initialize participants from all calls
          const participantsList: Participant[] = [];
          
          data.forEach(callData => {
            // Add caller if not already in the list and not the current user
            if (callData.caller_id !== session?.user?.id && 
                !participantsList.some(p => p.id === callData.caller_id)) {
              participantsList.push({
                id: callData.caller_id,
                name: callData.caller?.username || callData.caller?.email || callData.caller_id,
              });
            }
            
            // Add receiver if not already in the list and not the current user
            if (callData.receiver_id !== session?.user?.id && 
                !participantsList.some(p => p.id === callData.receiver_id)) {
              participantsList.push({
                id: callData.receiver_id,
                name: callData.receiver?.username || callData.receiver?.email || callData.receiver_id,
              });
            }
          });
          
          setParticipants(participantsList);
        }
      } else {
        // For private calls, load just the single call
        const { data, error } = await supabase
          .from('public_chat_calls')
          .select(`
            *,
            caller:users!caller_id(id, username, email),
            receiver:users!receiver_id(id, username, email)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setCall(data as Call);
        
        // Initialize the other participant (either caller or receiver)
        const otherParticipantId = data.caller_id === session?.user?.id ? data.receiver_id : data.caller_id;
        const otherParticipantName = data.caller_id === session?.user?.id 
          ? (data.receiver?.username || data.receiver?.email || data.receiver_id)
          : (data.caller?.username || data.caller?.email || data.caller_id);
        
        setParticipants([{
          id: otherParticipantId,
          name: otherParticipantName
        }]);
      }
    } catch (error: any) {
      console.error('Error loading call:', error);
      setError('Failed to load call: ' + (error.message || 'Unknown error'));
      router.back();
    }
  };

  const setupWebRTC = async () => {
    try {
      // Request permissions
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: call?.call_type === 'video',
      });

      setLocalStream(stream);

      // Set up signaling channel
      const channel = supabase.channel(`call-${isGroup ? roomId : id}`);
      
      channel.on('broadcast', { event: 'offer' }, async (payload) => {
        if (payload.payload.targetUserId === session?.user?.id) {
          await handleOffer(payload.payload.offer, payload.payload.fromUserId);
        }
      });
      
      channel.on('broadcast', { event: 'answer' }, async (payload) => {
        if (payload.payload.targetUserId === session?.user?.id) {
          await handleAnswer(payload.payload.answer, payload.payload.fromUserId);
        }
      });
      
      channel.on('broadcast', { event: 'ice-candidate' }, async (payload) => {
        if (payload.payload.targetUserId === session?.user?.id) {
          await handleIceCandidate(payload.payload.candidate, payload.payload.fromUserId);
        }
      });
      
      channel.on('broadcast', { event: 'user-joined' }, async (payload) => {
        console.log('User joined:', payload.payload.userId);
        // If we're the initiator, send an offer to the new user
        if (call?.caller_id === session?.user?.id) {
          await createPeerConnection(payload.payload.userId);
        }
      });
      
      channel.subscribe();
      supabaseChannel.current = channel;
      
      // Announce our presence in the room
      channel.send({
        type: 'broadcast',
        event: 'user-joined',
        payload: { userId: session?.user?.id },
      });
      
      // If we're the caller, initiate connections to all participants
      if (call?.caller_id === session?.user?.id) {
        for (const participant of participants) {
          await createPeerConnection(participant.id);
        }
      }

    } catch (error: any) {
      console.error('Error setting up WebRTC:', error);
      setError('Failed to set up WebRTC: ' + (error.message || 'Unknown error'));
      throw error;
    }
  };

  const createPeerConnection = async (participantId: string): Promise<RTCPeerConnectionInstance> => {
    try {
      // Create peer connection
      const configuration = { 
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };
      
      const pc = new RTCPeerConnection(configuration) as RTCPeerConnectionInstance;
      
      // Store the connection
      peerConnections.current.set(participantId, pc);
      
      // Update participant with connection
      setParticipants(prev => 
        prev.map(p => p.id === participantId ? { ...p, connection: pc } : p)
      );

      // Add local stream
      if (localStream) {
        localStream.getTracks().forEach((track: CustomMediaStreamTrack) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      // @ts-ignore - Type definitions issue in react-native-webrtc
      pc.ontrack = (event: { streams: CustomMediaStream[] }) => {
        const remoteStream = event.streams[0];
        
        // Update participant with stream
        setParticipants(prev => 
          prev.map(p => p.id === participantId ? { ...p, stream: remoteStream } : p)
        );
      };

      // Handle ICE candidates
      // @ts-ignore - Type definitions issue in react-native-webrtc
      pc.onicecandidate = (event: { candidate: any }) => {
        if (event.candidate) {
          // Send candidate to remote peer via Supabase Realtime
          supabaseChannel.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: { 
              candidate: event.candidate,
              fromUserId: session?.user?.id,
              targetUserId: participantId
            },
          });
        }
      };
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      supabaseChannel.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: { 
          offer: offer,
          fromUserId: session?.user?.id,
          targetUserId: participantId
        },
      });
      
      return pc;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      throw error;
    }
  };

  const handleOffer = async (offer: any, fromUserId: string) => {
    try {
      let pc = peerConnections.current.get(fromUserId);
      
      if (!pc) {
        // Create new peer connection if it doesn't exist
        const configuration = { 
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        };
        
        pc = new RTCPeerConnection(configuration) as RTCPeerConnectionInstance;
        peerConnections.current.set(fromUserId, pc);
        
        // Update participant with connection
        setParticipants(prev => 
          prev.map(p => p.id === fromUserId ? { ...p, connection: pc } : p)
        );
        
        // Add local stream
        if (localStream) {
          localStream.getTracks().forEach((track: CustomMediaStreamTrack) => {
            pc!.addTrack(track, localStream);
          });
        }
        
        // Handle remote stream
        // @ts-ignore - Type definitions issue in react-native-webrtc
        pc.ontrack = (event: { streams: CustomMediaStream[] }) => {
          const remoteStream = event.streams[0];
          
          // Update participant with stream
          setParticipants(prev => 
            prev.map(p => p.id === fromUserId ? { ...p, stream: remoteStream } : p)
          );
        };
        
        // Handle ICE candidates
        // @ts-ignore - Type definitions issue in react-native-webrtc
        pc.onicecandidate = (event: { candidate: any }) => {
          if (event.candidate) {
            // Send candidate to remote peer via Supabase Realtime
            supabaseChannel.current.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: { 
                candidate: event.candidate,
                fromUserId: session?.user?.id,
                targetUserId: fromUserId
              },
            });
          }
        };
      }
      
      // Set remote description
      await pc!.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await pc!.createAnswer();
      await pc!.setLocalDescription(answer);
      
      // Send answer
      supabaseChannel.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: { 
          answer: answer,
          fromUserId: session?.user?.id,
          targetUserId: fromUserId
        },
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: any, fromUserId: string) => {
    try {
      const pc = peerConnections.current.get(fromUserId);
      
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: any, fromUserId: string) => {
    try {
      const pc = peerConnections.current.get(fromUserId);
      
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const cleanupWebRTC = () => {
    // Close all peer connections
    peerConnections.current.forEach(pc => {
      try {
        pc.close();
      } catch (error) {
        console.warn('Error closing peer connection:', error);
      }
    });
    
    // Stop local stream tracks
    if (localStream) {
      try {
        localStream.getTracks().forEach((track: CustomMediaStreamTrack) => track.stop());
      } catch (error) {
        console.warn('Error stopping tracks:', error);
      }
    }
    
    // Unsubscribe from channel
    if (supabaseChannel.current) {
      supabaseChannel.current.unsubscribe();
    }
  };

  const handleEndCall = async () => {
    try {
      if (isGroup && roomId) {
        // For group calls, update all calls with this room_id
        const { error } = await supabase
          .from('public_chat_calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('room_id', roomId)
          .in('participant_id', [session?.user?.id]);
          
        if (error) throw error;
      } else {
        // For private calls, update just this call
        const { error } = await supabase
          .from('public_chat_calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (error) throw error;
      }
      
      cleanupWebRTC();
      router.back();
    } catch (error: any) {
      console.error('Error ending call:', error);
      setError('Failed to end call: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleMute = () => {
    if (localStream) {
      try {
        localStream.getAudioTracks().forEach((track: CustomMediaStreamTrack) => {
          track.enabled = !track.enabled;
        });
        setIsMuted(!isMuted);
      } catch (error) {
        console.warn('Error toggling mute:', error);
      }
    }
  };

  const toggleSpeaker = () => {
    // This is a placeholder - actual implementation depends on the platform
    setIsSpeakerOn(!isSpeakerOn);
  };

  const toggleVideo = () => {
    if (localStream && call?.call_type === 'video') {
      try {
        localStream.getVideoTracks().forEach((track: CustomMediaStreamTrack) => {
          track.enabled = !track.enabled;
        });
        setIsVideoEnabled(!isVideoEnabled);
      } catch (error) {
        console.warn('Error toggling video:', error);
      }
    }
  };

  const renderParticipantVideo = (participant: Participant) => {
    if (!participant.stream) {
      return (
        <View style={styles.emptyVideoContainer}>
          <Text style={styles.participantName}>{participant.name}</Text>
          <Text style={styles.connectingText}>Connecting...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.videoContainer}>
        <RTCView
          streamURL={participant.stream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
        <View style={styles.participantNameContainer}>
          <Text style={styles.participantName}>{participant.name}</Text>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.callHeader}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleEndCall}
          style={styles.backButton}
        />
        <View style={styles.callInfo}>
          <Text style={styles.callType}>
            {call?.call_type === 'audio' ? 'Voice Call' : 'Video Call'}
            {isGroup ? ' (Group)' : ''}
          </Text>
          <Text style={styles.callStatus}>
            {call?.status === 'initiated' ? 'Connecting...' : 'Connected'}
          </Text>
        </View>
      </View>

      {call?.call_type === 'video' ? (
        <View style={styles.videoArea}>
          {/* Local video preview */}
          {localStream && (
            <View style={styles.localVideoContainer}>
              <RTCView
                streamURL={localStream.toURL()}
                style={styles.localVideo}
                objectFit="cover"
              />
              <View style={styles.participantNameContainer}>
                <Text style={styles.participantName}>You</Text>
              </View>
            </View>
          )}
          
          {isGroup ? (
            // Group call layout
            <ScrollView contentContainerStyle={styles.participantsGrid}>
              {participants.map(participant => (
                <View key={participant.id} style={styles.participantCell}>
                  {renderParticipantVideo(participant)}
                </View>
              ))}
            </ScrollView>
          ) : (
            // One-on-one call layout
            <View style={styles.singleParticipantContainer}>
              {participants.length > 0 && renderParticipantVideo(participants[0])}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.audioCallContainer}>
          <View style={styles.audioCallContent}>
            <View style={styles.audioCallAvatar}>
              <Text style={styles.audioCallAvatarText}>
                {participants.length > 0 ? participants[0].name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.audioCallName}>
              {isGroup 
                ? `Group Call (${participants.length} participants)` 
                : (participants.length > 0 ? participants[0].name : 'Unknown')}
            </Text>
            <Text style={styles.audioCallStatus}>
              {call?.status === 'initiated' ? 'Connecting...' : 'Connected'}
            </Text>
            
            {isGroup && (
              <View style={styles.participantChips}>
                {participants.map(participant => (
                  <Chip key={participant.id} style={styles.participantChip}>
                    {participant.name}
                  </Chip>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.controls}>
        <IconButton
          icon={isMuted ? "microphone-off" : "microphone"}
          size={30}
          onPress={toggleMute}
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
        />
        {call?.call_type === 'video' && (
          <IconButton
            icon={isVideoEnabled ? "video" : "video-off"}
            size={30}
            onPress={toggleVideo}
            style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
          />
        )}
        <IconButton
          icon={isSpeakerOn ? "volume-high" : "volume-medium"}
          size={30}
          onPress={toggleSpeaker}
          style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
        />
        <IconButton
          icon="phone-hangup"
          size={30}
          onPress={handleEndCall}
          style={[styles.controlButton, styles.endCallButton]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  callInfo: {
    marginLeft: 16,
  },
  callType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  participantCell: {
    width: '50%',
    aspectRatio: 0.75,
    padding: 4,
  },
  singleParticipantContainer: {
    flex: 1,
    width: '100%',
  },
  videoContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  participantNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  participantName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  connectingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  emptyVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
  },
  audioCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioCallContent: {
    alignItems: 'center',
  },
  audioCallAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  audioCallAvatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  audioCallName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  audioCallStatus: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 24,
  },
  participantChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    maxWidth: 300,
  },
  participantChip: {
    margin: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    width: 60,
    height: 60,
  },
  controlButtonActive: {
    backgroundColor: '#3b82f6',
  },
  endCallButton: {
    backgroundColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    padding: 16,
  },
}); 