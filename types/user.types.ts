export type UserRole = 'partner' | 'admin' | 'staff';

export type User = {
    id: string;
    email: string;
    password_hash: string;
    role: UserRole;
    created_at: string;
    last_login?: string;
    is_active: boolean;
};

export type UserInsert = Omit<User, 'id' | 'created_at' | 'last_login'>;

export type UserLogin = {
    email: string;
    password: string;
}; 