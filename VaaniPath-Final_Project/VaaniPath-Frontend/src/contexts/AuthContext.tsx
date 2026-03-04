import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup, getCurrentUser, logout as apiLogout, User, LoginCredentials, SignupData } from '@/services/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (userData: SignupData) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAdmin: boolean;
    isTeacher: boolean;
    isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const freshUser = await getCurrentUser();
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        }
    };

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Initial refresh
                await refreshUser();
            }
            setIsLoading(false);
        };

        loadUser();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            const tokenResponse = await apiLogin(credentials);
            const accessToken = tokenResponse.access_token;
            const userData = tokenResponse.user; // User object is already in the login response

            // Store token
            localStorage.setItem('token', accessToken);
            setToken(accessToken);

            // Store and set user data (includes preferred_language)
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            console.log('✅ User logged in with preferred language:', userData.preferred_language);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const signup = async (userData: SignupData) => {
        try {
            const newUser = await apiSignup(userData);

            // Auto-login after signup
            await login({ email: userData.email, password: userData.password });
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    };

    const logout = () => {
        apiLogout();
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear language preference so next user (or guest) gets default
        localStorage.removeItem('i18nextLng');
        // Optional: Force reload or reset i18n here if we could access it, 
        // but removing from localStorage ensures default on next load.

        setToken(null);
        setUser(null);

        // Force a window reload to ensure all states (including i18n) are reset cleanly
        // This is often the safest way to clear user session data in frontend
        window.location.href = '/landingpage';
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        isAdmin: user?.is_admin || false,
        isTeacher: user?.is_teacher || false,
        isStudent: !user?.is_admin && !user?.is_teacher,
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
