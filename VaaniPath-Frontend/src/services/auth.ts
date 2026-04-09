import api from './api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    full_name: string;
    is_admin?: boolean;
    preferred_language?: string;
    profile_image?: File | null;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    is_admin: boolean;
    is_teacher: boolean;
    preferred_language: string;  // User's preferred UI language
    avatar_url?: string; // Add avatar_url
    contact_number?: string;
    qualification?: string;
    specialization?: string;
    domain_expertise?: string;
    created_at: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    user: User;  // User object returned from login
}

// Login
export const login = async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', credentials);
    return response.data;
};

// Signup (students only)
export const signup = async (userData: SignupData): Promise<User> => {
    let requestData: any = userData;
    let headers: any = {};

    // Use FormData if profile_image is present
    if (userData.profile_image) {
        const formData = new FormData();
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('full_name', userData.full_name);
        formData.append('profile_image', userData.profile_image);
        if (userData.preferred_language) formData.append('preferred_language', userData.preferred_language);
        if (userData.is_admin !== undefined) formData.append('is_admin', String(userData.is_admin));

        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
    } else {
        // If we are using Form on backend, we should probably ALWAYS use FormData for consistency
        // But if backend supports simple JSON, we can stick to JSON.
        // However, I changed backend to use Form(). This REQUIRES FormData or x-www-form-urlencoded
        // sending JSON will fail 422 if backend expects Form.

        // So I MUST send FormData always now.
        const formData = new FormData();
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('full_name', userData.full_name);
        if (userData.preferred_language) formData.append('preferred_language', userData.preferred_language);
        if (userData.is_admin !== undefined) formData.append('is_admin', String(userData.is_admin));

        requestData = formData;
        headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.post<User>('/auth/signup', requestData, { headers });
    return response.data;
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
};

// Update Profile Avatar (Legacy, kept for compatibility if needed)
export const updateAvatar = async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_image', file);

    const response = await api.patch<User>('/auth/me/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export interface ProfileUpdateData {
    profile_image?: File | null;
    full_name?: string;
    contact_number?: string;
    qualification?: string;
    specialization?: string;
    domain_expertise?: string;
}

export const updateProfile = async (data: ProfileUpdateData): Promise<User> => {
    const formData = new FormData();
    if (data.profile_image) formData.append('profile_image', data.profile_image);
    if (data.full_name) formData.append('full_name', data.full_name);
    if (data.contact_number) formData.append('contact_number', data.contact_number);
    if (data.qualification) formData.append('qualification', data.qualification);
    if (data.specialization) formData.append('specialization', data.specialization);
    if (data.domain_expertise) formData.append('domain_expertise', data.domain_expertise);

    const token = localStorage.getItem('token');

    // Use 127.0.0.1 to avoid IPv6 resolution issues on Windows
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me/profile', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Profile update failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check if backend is running.');
        }
        throw error;
    }
};

// Logout
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};
