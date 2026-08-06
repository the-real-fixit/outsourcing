import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Mail, Globe, ChevronLeft, Moon, Sun, Lock, Trash2, X } from 'lucide-react';
import { useSettings, type UserSettings } from '../context/SettingsContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, isLoading } = useSettings();
    const { t } = useTranslation();
    const { logout } = useAuth();

    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToggle = async (key: keyof UserSettings) => {
        try {
            await updateSettings({ [key]: !settings[key] });
        } catch (error) {
            alert(t('settings.error', { defaultValue: 'Ocurrió un error al guardar' }));
        }
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        try {
            await updateSettings({ language: e.target.value });
        } catch (error) {
            alert(t('settings.error', { defaultValue: 'Ocurrió un error al guardar' }));
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        setIsSubmitting(true);
        try {
            await api.put('/users/change-password', { currentPassword, newPassword });
            setSuccessMsg('Contraseña actualizada con éxito');
            setTimeout(() => {
                setPasswordModalOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setSuccessMsg('');
            }, 1500);
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || 'Error al cambiar la contraseña');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'ELIMINAR') {
            setErrorMsg('Escribe ELIMINAR para confirmar');
            return;
        }
        setIsSubmitting(true);
        try {
            await api.delete('/users/me');
            logout();
            navigate('/login');
        } catch (error: any) {
            setErrorMsg(error.response?.data?.message || 'Error al eliminar la cuenta');
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64 dark:text-gray-200">Cargando ajustes...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 mb-6 transition-colors">
                <ChevronLeft size={16} className="mr-1" />
                {t('settings.back', { defaultValue: 'Volver' })}
            </button>

            <div className="mb-6">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Ajustes de la cuenta</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestiona tus preferencias, apariencia y seguridad.</p>
            </div>

            <div className="space-y-6">
                
                {/* APARIENCIA */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Apariencia</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {/* Dark Mode */}
                        <div className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 p-3 rounded-lg flex-shrink-0">
                                    {settings.darkMode ? <Moon size={20} /> : <Sun size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Modo Oscuro</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cambiar entre tema claro y oscuro</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle('darkMode')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${settings.darkMode ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${settings.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
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

                {/* NOTIFICATIONS */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notificaciones</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
                    </div>
                </div>

                {/* ACCOUNT & SECURITY */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cuenta y Seguridad</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        <div className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-3 rounded-lg flex-shrink-0">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Contraseña</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Mantén tu cuenta segura actualizando tu contraseña regularmente.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPasswordModalOpen(true)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cambiar
                            </button>
                        </div>
                        <div className="px-6 py-5 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg flex-shrink-0">
                                    <Trash2 size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Eliminar Cuenta</h4>
                                    <p className="text-xs text-red-500 dark:text-red-400/80 mt-0.5">Esta acción es irreversible y ocultará tus datos.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="px-4 py-2 border border-red-300 dark:border-red-800 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cambiar Contraseña</h3>
                            <button onClick={() => setPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                            {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{errorMsg}</div>}
                            {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">{successMsg}</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Actual</label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="pt-2 flex justify-end space-x-3">
                                <button type="button" onClick={() => setPasswordModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-500">¿Eliminar Cuenta?</h3>
                            <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Estás a punto de eliminar tu cuenta. Esta acción no se puede deshacer. Se borrarán tus datos personales y serás desconectado.
                            </p>
                            {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{errorMsg}</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Escribe <span className="font-bold">ELIMINAR</span> para confirmar:
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="ELIMINAR"
                                />
                            </div>
                            <div className="pt-2 flex justify-end space-x-3">
                                <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                                    Cancelar
                                </button>
                                <button onClick={handleDeleteAccount} disabled={isSubmitting || deleteConfirmText !== 'ELIMINAR'} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Eliminando...' : 'Eliminar Cuenta'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
