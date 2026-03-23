import { Search, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const LandingNavbar = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [showCategories, setShowCategories] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        <nav className="bg-yellow-300 shadow-sm sticky top-0 z-50">
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
                                placeholder=""
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
                                                onClick={() => setShowCategories(false)}
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

                    {/* Auth Buttons */}
                    <div className="flex items-center space-x-6 pl-4">
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
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default LandingNavbar;
