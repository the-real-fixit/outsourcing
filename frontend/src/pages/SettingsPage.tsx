import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Mail, Globe, ChevronLeft } from 'lucide-react';
import { useSettings, type UserSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, isLoading } = useSettings();
    const { t } = useTranslation();

    const handleToggle = async (key: keyof UserSettings) => {
        try {
            await updateSettings({ [key]: !settings[key] });
        } catch (error) {
            alert(t('settings.error'));
        }
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            await updateSettings({ language: e.target.value });
        } catch (error) {
            alert(t('settings.error'));
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64 dark:text-gray-200">Cargando ajustes...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 mb-6 transition-colors">
                <ChevronLeft size={16} className="mr-1" />
                {t('settings.back')}
            </button>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="px-6 py-5 bg-yellow-300 dark:bg-yellow-600 transition-colors">
                    <h3 className="text-2xl font-black text-black dark:text-gray-900">{t('settings.title')}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-800 dark:text-gray-100 font-medium">{t('settings.subtitle')}</p>
                </div>

                <div className="divide-y divide-gray-100">
                    {/* Notifications */}
                    <div className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-3 rounded-lg flex-shrink-0">
                                {settings.notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('settings.pushNotif')}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.pushNotifDesc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('notificationsEnabled')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${settings.notificationsEnabled ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Email Notifications */}
                    <div className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-3 rounded-lg flex-shrink-0">
                                <Mail size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('settings.emailNotif')}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.emailNotifDesc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle('emailNotifications')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${settings.emailNotifications ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Language */}
                    <div className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 p-3 rounded-lg flex-shrink-0">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('settings.language')}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('settings.languageDesc')}</p>
                            </div>
                        </div>
                        <select
                            value={settings.language}
                            onChange={handleLanguageChange}
                            className="block px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 dark:border-gray-600 border shadow-sm outline-none bg-white dark:bg-gray-700 dark:text-white font-medium transition-colors cursor-pointer ml-4"
                        >
                            <option value="es">Español</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
