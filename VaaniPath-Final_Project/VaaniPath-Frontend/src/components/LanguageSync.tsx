import { useUserLanguage } from '@/hooks/useUserLanguage';

/**
 * Component that activates automatic language synchronization
 * Must be inside AuthProvider to access user context
 */
export function LanguageSync() {
    // This hook automatically syncs language when user changes
    useUserLanguage();

    // This component renders nothing, it just runs the hook
    return null;
}
