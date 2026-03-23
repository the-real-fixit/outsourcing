import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login({ email, password });
            navigate('/app');
        } catch (err) {
            setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-yellow-500">
                    <LogIn size={48} />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Inicia sesión en tu cuenta
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    O{' '}
                    <Link to="/register" className="font-medium text-yellow-600 hover:text-yellow-500">
                        crea una cuenta nueva
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Correo electrónico
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="correo@algo.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                            >
                                Entrar
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
