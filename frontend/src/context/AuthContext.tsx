import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN' | 'guest';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    email: string;
}

interface AuthContextType {
    user: User | null;
    role: UserRole;
    login: (data: Record<string, string>) => Promise<void>;
    register: (data: Record<string, string>) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<{ name?: string, exp: number, sub: string, role: string, email: string }>(token);
                // Validar expiración si es necesario
                setUser({
                    id: decoded.sub,
                    name: decoded.name || 'Usuario', // El nombre podría no estar en el token si no se agregó
                    role: decoded.role as UserRole,
                    email: decoded.email
                });
            } catch (error) {
                console.error("Token inválido", error);
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (data: Record<string, string>) => {
        try {
            const response = await api.post('/auth/login', data);
            const { access_token, user } = response.data;
            localStorage.setItem('token', access_token);
            setUser(user);
        } catch (error) {
            console.error("Login fallido", error);
            throw error;
        }
    };

    const register = async (data: Record<string, string>) => {
        try {
            const response = await api.post('/auth/register', data);
            const { access_token, user } = response.data;
            localStorage.setItem('token', access_token);
            setUser(user);
        } catch (error) {
            console.error("Registro fallido", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        role: user?.role || 'guest',
        login,
        register,
        logout,
        isLoading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
