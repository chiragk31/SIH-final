import { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

// Map database language codes to i18n codes
const LANGUAGE_MAP: Record<string, string> = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'mr': 'mr-IN',
    'gu': 'gu-IN',
    'kn': 'kn-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'bn': 'bn-IN',
    'ml': 'ml-IN',
    'pa': 'pa-IN',
    // Add others if needed
};

/**
 * Helper to normalize language code
 */
const normalizeLanguage = (lang: string): string => {
    // If exact match exists in map
    if (LANGUAGE_MAP[lang]) return LANGUAGE_MAP[lang];

    // If already has -IN suffix, verify, otherwise return as is
    // This allows 'hi-IN' from DB to work, and 'mr' to map to 'mr-IN'
    return lang;
};

/**
 * Custom hook for managing user language preferences
 */
export function useUserLanguage() {
    const { i18n } = useTranslation();
    const { user, token } = useAuth();
    const hasInitialized = useRef(false);

    // Initialize language on mount and when user changes
    useEffect(() => {
        const initializeLanguage = async () => {
            // Priority order:
            // 1. User's preferred language from backend (if logged in)
            // 2. Previously saved language in localStorage
            // 3. i18n default language

            let targetLanguage = i18n.language || 'en-IN';

            // EXACT LOG REQUESTED BY USER
            console.log("--------------------------------------------------");
            console.log("🔎 DEBUG: Fetching preferred language of learner...");
            console.log("👤 User Object:", user);
            console.log("🗣️ RAW preferred_language:", user?.preferred_language);
            console.log("--------------------------------------------------");

            if (user?.preferred_language) {
                // Normalize DB code (e.g. 'mr' -> 'mr-IN')
                targetLanguage = normalizeLanguage(user.preferred_language);
                console.log(`🔄 Normalized Language Code: ${targetLanguage}`);
            } else if (!user) {
                // Check localStorage for guest users or fallback
                const savedLang = localStorage.getItem('i18nextLng');
                if (savedLang) {
                    targetLanguage = savedLang;
                    console.log(`💾 Found language in localStorage: ${savedLang}`);
                }
            }

            // Only change if different from current language
            if (i18n.language !== targetLanguage) {
                console.log(`🔄 Switching language: ${i18n.language} -> ${targetLanguage}`);
                await i18n.changeLanguage(targetLanguage);
                localStorage.setItem('i18nextLng', targetLanguage);
            }

            hasInitialized.current = true;
        };

        initializeLanguage();
    }, [user?.preferred_language]); // Only re-run when user's preferred language changes

    // Function to update user language preference
    const setUserLanguage = useCallback(async (newLang: string) => {
        try {
            console.log(`📝 Setting language to: ${newLang}`);
            // Update i18n immediately for instant UI feedback
            await i18n.changeLanguage(newLang);
            localStorage.setItem('i18nextLng', newLang);

            // Update backend if user is logged in
            if (token) {
                // When saving to backend, we can save the full code or short code
                // Let's save what the frontend uses (e.g. mr-IN or mr)
                // Actually database seems to use short codes sometimes, let's keep it flexible

                await axios.patch(
                    `${API_URL}/auth/me/language`,
                    { language: newLang },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log(`✅ Language updated in backend: ${newLang}`);
            }
        } catch (error) {
            console.error('Failed to update language preference:', error);
        }
    }, [i18n, token]);

    return {
        currentLanguage: i18n.language,
        setUserLanguage,
        isReady: i18n.isInitialized,
    };
}
