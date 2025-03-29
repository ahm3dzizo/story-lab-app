import { supabase } from '@/lib/supabase';
import { User, UserInsert, UserLogin } from '@/types/user.types';
import * as bcrypt from 'bcrypt';

export class AuthService {
    private static SALT_ROUNDS = 10;

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static async registerUser(email: string, password: string, role: User['role'] = 'partner'): Promise<User | null> {
        try {
            const passwordHash = await this.hashPassword(password);

            const { data: userData, error: userError } = await supabase
                .from('users')
                .insert({
                    email,
                    password_hash: passwordHash,
                    role,
                    is_active: true
                })
                .select()
                .single();

            if (userError) throw userError;

            return userData;
        } catch (error) {
            console.error('Error registering user:', error);
            return null;
        }
    }

    static async login(credentials: UserLogin): Promise<{ user: User | null; error?: string }> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', credentials.email.toLowerCase())
                .eq('is_active', true)
                .single();

            if (error) throw error;
            if (!user) return { user: null, error: 'User not found' };

            const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash);
            if (!isValidPassword) {
                return { user: null, error: 'Invalid password' };
            }

            // Update last login
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);

            return { user };
        } catch (error) {
            console.error('Error logging in:', error);
            return { user: null, error: 'Login failed' };
        }
    }

    static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (!user) return { success: false, error: 'User not found' };

            const isValidPassword = await this.verifyPassword(oldPassword, user.password_hash);
            if (!isValidPassword) {
                return { success: false, error: 'Invalid current password' };
            }

            const newPasswordHash = await this.hashPassword(newPassword);
            const { error: updateError } = await supabase
                .from('users')
                .update({ password_hash: newPasswordHash })
                .eq('id', userId);

            if (updateError) throw updateError;

            return { success: true };
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, error: 'Failed to change password' };
        }
    }

    static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error) throw error;
            if (!user) return { success: false, error: 'User not found' };

            // Generate temporary password
            const tempPassword = Math.random().toString(36).slice(-8);
            const passwordHash = await this.hashPassword(tempPassword);

            const { error: updateError } = await supabase
                .from('users')
                .update({ password_hash: passwordHash })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // TODO: Send email with temporary password
            console.log('Temporary password:', tempPassword);

            return { success: true };
        } catch (error) {
            console.error('Error resetting password:', error);
            return { success: false, error: 'Failed to reset password' };
        }
    }
} 