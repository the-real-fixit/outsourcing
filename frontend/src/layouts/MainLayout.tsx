import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, ChevronDown, MessageSquare, Settings, User as UserIcon, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const isChatRoute = location.pathname.startsWith('/app/chats');

    // Notifications state
    const [globalUnread, setGlobalUnread] = useState(0);
    const socketRef = useRef<Socket>(null);
    const currentPathRef = useRef(location.pathname);

    useEffect(() => {
        currentPathRef.current = location.pathname;
    }, [location.pathname]);

    useEffect(() => {
        if (!user) return;
        const fetchUnread = async () => {
            try {
                const res = await api.get('/chats');
                const count = res.data.reduce((acc: number, chat: { unreadCount?: number }) => acc + (chat.unreadCount || 0), 0);
                setGlobalUnread(count);
            } catch (err) {
                console.error("Error fetching chats for unread count", err);
            }
        };
        fetchUnread();
    }, [user, location.pathname]);

    useEffect(() => {
        if (!user) return;

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Connect global socket
        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
            auth: { token: localStorage.getItem('token') }
        });

        socketRef.current.on('newMessage', (msg) => {
            if (msg.receiverId === user.id) {
                const isCurrentlyChatting = currentPathRef.current === `/app/chats/${msg.senderId}`;
                
                if (!isCurrentlyChatting) {
                    setGlobalUnread(prev => prev + 1);
                    
                    if ('Notification' in window && Notification.permission === 'granted') {
                        if (document.hidden || !isCurrentlyChatting) {
                            try {
                                const notif = new Notification('Nuevo mensaje en Fix it!', {
                                    body: msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content,
                                    // icon: '/icon.png' // optional icon if you have one
                                });
                                notif.onclick = () => {
                                    window.focus();
                                    navigate(`/app/chats/${msg.senderId}`);
                                };
                            } catch (e) {
                                console.error('Notification error', e);
                            }
                        }
                    }
                }
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user, navigate]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                setCategories(response.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCategories(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`flex flex-col bg-gray-50 transition-colors ${isChatRoute ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
            {/* Header */}
            <header className="bg-yellow-300 shadow-sm sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center pr-4">
                            <Link to={user ? "/app" : "/"} className="text-3xl font-black text-black tracking-tight" style={{ fontFamily: "'Arial Black', Impact, sans-serif" }}>
                                Fix it!
                            </Link>
                        </div>

                        {/* Search Bar - Center */}
                        <div className="hidden md:flex flex-1 items-center justify-center px-4 lg:px-12 w-full max-w-4xl">
                            <div className="flex w-full items-center bg-gray-200 rounded-sm overflow-visible h-10 shadow-inner">
                                <div className="pl-3 flex items-center justify-center">
                                    <Search className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
                                </div>
                                <input
                                    type="text"
                                    className="flex-grow py-2 px-3 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-500 text-sm"
                                    placeholder="Buscar servicios, profesionales..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            navigate(`/app?search=${encodeURIComponent(searchQuery.trim())}`);
                                        }
                                    }}
                                />
                                <div className="relative h-full" ref={dropdownRef}>
                                    <div
                                        className="flex items-center h-full px-4 border-l-2 border-white cursor-pointer hover:bg-gray-300 transition-colors"
                                        onClick={() => setShowCategories(!showCategories)}
                                    >
                                        <span className="text-sm font-bold text-black mr-2">Categorías</span>
                                        <ChevronDown className="h-6 w-6 text-yellow-500" strokeWidth={3} />
                                    </div>

                                    {showCategories && (
                                        <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50">
                                            {categories.length > 0 ? categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                                                    onClick={() => {
                                                        setShowCategories(false);
                                                        navigate(`/app?categoryId=${cat.id}`);
                                                    }}
                                                >
                                                    {cat.name}
                                                </button>
                                            )) : (
                                                <div className="px-4 py-2 text-sm text-gray-500">Cargando...</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation / User Menu (Right Icons) */}
                        <div className="flex items-center space-x-6 pl-4">
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-5">
                                        <button
                                            onClick={() => navigate('/app')}
                                            className="text-black hover:text-gray-800 transition-colors" title={t('nav.home')}
                                        >
                                            <Home className="h-7 w-7 fill-black" strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => navigate('/app/chats')}
                                            className="text-black hover:text-gray-800 transition-colors relative" title={t('nav.chats')}
                                        >
                                            <MessageSquare className="h-7 w-7 fill-black" strokeWidth={2.5} />
                                            {globalUnread > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-yellow-300">
                                                    {globalUnread > 99 ? '99+' : globalUnread}
                                                </span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => navigate('/app/settings')}
                                            className="text-black hover:text-gray-800 transition-colors" title={t('nav.settings')}>
                                            <Settings className="h-7 w-7 fill-black" strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => navigate('/app/profile')}
                                            className="text-black hover:text-gray-800 transition-colors" title={t('nav.profile')}
                                        >
                                            <UserIcon className="h-8 w-8 fill-black" strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => { logout(); navigate('/'); }}
                                            className="ml-4 text-xs font-bold uppercase text-gray-600 hover:text-black"
                                        >
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-black font-bold hover:text-gray-700 px-3 py-2 text-sm"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="text-black font-bold hover:text-gray-700 px-3 py-2 text-sm"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                            <button className="md:hidden p-2 rounded-md text-black hover:text-gray-800 focus:outline-none">
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className={`flex-grow flex flex-col ${isChatRoute ? 'overflow-hidden min-h-0' : ''}`}>
                <div className={isChatRoute ? 'flex-1 w-full flex min-h-0' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-1 w-full'}>
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            {!isChatRoute && (
                <footer className="bg-white border-t border-gray-200 mt-auto flex-shrink-0 transition-colors">
                    <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
                        <p className="mt-4 text-center text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} Fix it! - Tu plataforma de confianza. Todos los derechos reservados.
                        </p>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default MainLayout;
