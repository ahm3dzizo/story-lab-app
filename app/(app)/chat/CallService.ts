import { supabase } from '@/lib/supabase';

interface CallOptions {
  callerId: string;
  receiverIds: string[];
  callType: 'audio' | 'video';
  isGroup: boolean;
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

export class CallService {
  /**
   * Initiates a call (either private or group)
   */
  static async initiateCall(options: CallOptions): Promise<{ call: Call; roomId?: string }> {
    try {
      if (options.receiverIds.length === 0) {
        throw new Error('No receivers specified for the call');
      }

      if (options.isGroup) {
        return await this.initiateGroupCall(options);
      } else {
        return await this.initiatePrivateCall(options);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Initiates a private call (1-to-1)
   */
  private static async initiatePrivateCall(options: CallOptions): Promise<{ call: Call }> {
    const { callerId, receiverIds, callType } = options;
    
    // For private calls, we only use the first receiver
    const receiverId = receiverIds[0];
    
    const { data, error } = await supabase
      .from('public_chat_calls')
      .insert({
        caller_id: callerId,
        receiver_id: receiverId,
        call_type: callType,
        room_id: `private_${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;
    
    return { call: data as Call };
  }

  /**
   * Initiates a group call
   */
  private static async initiateGroupCall(options: CallOptions): Promise<{ call: Call; roomId: string }> {
    const { callerId, receiverIds, callType } = options;
    
    // Create a unique room ID for the group call
    const roomId = `group_${Date.now()}`;
    
    // Create calls for each receiver
    const callPromises = receiverIds.map(receiverId => 
      supabase
        .from('public_chat_calls')
        .insert({
          caller_id: callerId,
          receiver_id: receiverId,
          call_type: callType,
          room_id: roomId
        })
        .select()
    );
    
    const results = await Promise.all(callPromises);
    
    // Check for errors
    const errors = results.filter(result => result.error).map(result => result.error);
    if (errors.length > 0) {
      console.error('Errors creating group call:', errors);
      throw new Error('Failed to create group call for some users');
    }
    
    // Return the first call and the room ID
    const firstCall = results[0].data?.[0] as Call;
    
    return { call: firstCall, roomId };
  }

  /**
   * Accepts an incoming call
   */
  static async acceptCall(callId: string): Promise<void> {
    const { error } = await supabase
      .from('public_chat_calls')
      .update({ status: 'ongoing' })
      .eq('id', callId);

    if (error) throw error;
  }

  /**
   * Rejects an incoming call
   */
  static async rejectCall(callId: string): Promise<void> {
    const { error } = await supabase
      .from('public_chat_calls')
      .update({ 
        status: 'missed',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId);

    if (error) throw error;
  }

  /**
   * Ends a call
   */
  static async endCall(callId: string, roomId?: string): Promise<void> {
    try {
      if (roomId) {
        // For group calls, update all calls with this room_id
        const { error } = await supabase
          .from('public_chat_calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('room_id', roomId);
          
        if (error) throw error;
      } else {
        // For private calls, update just this call
        const { error } = await supabase
          .from('public_chat_calls')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', callId);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  /**
   * Loads available users for calling
   */
  static async loadAvailableUsers(currentUserId: string): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email')
        .neq('id', currentUserId);
      
      if (error) throw error;
      
      return data.map(user => ({
        id: user.id,
        name: user.username || user.email || user.id
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  }
}

export default CallService; 