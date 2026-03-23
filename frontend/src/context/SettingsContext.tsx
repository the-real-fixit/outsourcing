import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

export interface UserSettings {
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    darkMode: boolean;
    language: string;
}

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: UserSettings = {
    notificationsEnabled: true,
    emailNotifications: true,
    darkMode: false,
    language: 'es',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { i18n } = useTranslation();
    
    // Initial state from localStorage for immediate UI rendering before API
    const [settings, setSettings] = useState<UserSettings>(() => {
        const local = localStorage.getItem('app_settings');
        return local ? JSON.parse(local) : defaultSettings;
    });
    const [isLoading, setIsLoading] = useState(true);

    // Apply specific settings immediately when they change via side effects
    useEffect(() => {
        // Language
        if (i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language);
        }

        // Persist locally
        localStorage.setItem('app_settings', JSON.stringify(settings));
    }, [settings, i18n]);

    // Fetch from backend when user logs in
    useEffect(() => {
        let isMounted = true;
        
        const fetchSettings = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            
            try {
                const response = await api.get('/users/settings');
                if (response.data && isMounted) {
                    setSettings({
                        notificationsEnabled: response.data.notificationsEnabled ?? true,
                        emailNotifications: response.data.emailNotifications ?? true,
                        darkMode: response.data.darkMode ?? false,
                        language: response.data.language ?? 'es',
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchSettings();

        return () => { isMounted = false; };
    }, [user]);

    const updateSettings = async (updates: Partial<UserSettings>) => {
        const newSettings = { ...settings, ...updates };
        
        // Optimistic update for snappy UI
        setSettings(newSettings);
        
        if (user) {
            try {
                await api.put('/users/settings', newSettings);
            } catch (error) {
                console.error("Error saving settings to backend:", error);
                // Revert on failure
                setSettings(settings);
                throw error;
            }
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
