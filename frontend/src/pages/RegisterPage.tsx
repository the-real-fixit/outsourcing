import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Briefcase, UserCircle, ArrowRight, ArrowLeft, Car, Navigation, Tag, ChevronRight } from 'lucide-react';
import api from '../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const initialRoleFromUrl = queryParams.get('role');
    const defaultRole = initialRoleFromUrl === 'provider' ? 'PROVIDER' : '';

    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'CLIENT' | 'PROVIDER' | ''>(defaultRole as any);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();

    // Provider-specific
    const [categoryId, setCategoryId] = useState('');
    const [canTravel, setCanTravel] = useState(false);
    const [hasVehicle, setHasVehicle] = useState(false);
    const [travelDetails, setTravelDetails] = useState('');
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [phone, setPhone] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handlePhoneChange = (val: string) => {
        const digits = val.replace(/\D/g, '');
        let formatted = digits;
        if (digits.length > 4) {
            formatted = digits.slice(0, 4) + '-' + digits.slice(4, 8);
        }
        setPhone(formatted);
    };

    const handleSubmit = async () => {
        setError('');
        try {
            await register({ name, email, password, role });
            // After registration, save profile data if provider
            if (role === 'PROVIDER') {
                try {
                    await api.put('/users/profile', {
                        name,
                        phone,
                        categoryId: categoryId || null,
                        canTravel,
                        hasVehicle,
                        travelDetails: travelDetails || null
                    });
                } catch (profileErr) {
                    console.error('Error saving profile after registration:', profileErr);
                }
            } else {
                if (phone) {
                    try {
                        await api.put('/users/profile', { name, phone });
                    } catch (profileErr) {
                        console.error('Error saving profile after registration:', profileErr);
                    }
                }
            }
            navigate('/app');
        } catch (err: unknown) {
            console.error(err);
            setError((err as any).response?.data?.message || 'Error al registrarse. Por favor, intenta de nuevo.');
        }
    };

    const canAdvance = () => {
        if (step === 1) return email.trim() !== '' && password.trim() !== '' && password.length >= 6;
        if (step === 2) return role !== '' && name.trim() !== '';
        return true;
    };

    const nextStep = () => {
        if (canAdvance()) {
            if (step === 2 && role === 'CLIENT') {
                // Clients don't need step 3, register directly
                handleSubmit();
                return;
            }
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-yellow-500">
                    <UserPlus size={48} />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Crea una cuenta nueva
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    O{' '}
                    <Link to="/login" className="font-medium text-yellow-600 hover:text-yellow-500">
                        inicia sesi&oacute;n si ya tienes una
                    </Link>
                </p>

                {/* Step indicator */}
                <div className="flex justify-center mt-6 gap-2">
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`h-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-yellow-400 w-8' : 'bg-gray-300 w-4'} ${s === 3 && role === 'CLIENT' ? 'hidden' : ''}`}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 relative overflow-hidden">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Email & Password */}
                    <div className={`transition-all duration-500 ease-in-out ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 absolute -translate-x-full pointer-events-none'}`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Datos de acceso</h3>
                        <p className="text-sm text-gray-500 mb-6">Ingresa tu correo y crea una contrase&ntilde;a segura.</p>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electr&oacute;nico</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email" type="email" autoComplete="email" required
                                        value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contrase&ntilde;a</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password" type="password" autoComplete="new-password" required
                                        value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                {password.length > 0 && password.length < 6 && (
                                    <p className="mt-1 text-xs text-red-500">La contraseña debe tener al menos 6 caracteres.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Role + Name */}
                    <div className={`transition-all duration-500 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0' : step < 2 ? 'opacity-0 absolute translate-x-full pointer-events-none' : 'opacity-0 absolute -translate-x-full pointer-events-none'}`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Cu&eacute;ntanos sobre ti</h3>
                        <p className="text-sm text-gray-500 mb-6">Tu nombre y qu&eacute; buscas en la plataforma.</p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                        className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                        placeholder="Juan Pérez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">
                                        GT +502
                                    </span>
                                    <input
                                        type="tel" value={phone} onChange={(e) => handlePhoneChange(e.target.value)}
                                        maxLength={9}
                                        className="focus:ring-yellow-500 focus:border-yellow-500 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 py-2.5 px-3 border"
                                        placeholder="1234-5678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Busco en Fix it...</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button" onClick={() => setRole('CLIENT')}
                                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 ${role === 'CLIENT' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <UserCircle className="h-8 w-8 mb-2" />
                                        <span className="text-sm font-bold">Contratar</span>
                                        <span className="text-[10px] text-gray-500 mt-1">Busco profesionales</span>
                                    </button>
                                    <button
                                        type="button" onClick={() => setRole('PROVIDER')}
                                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 ${role === 'PROVIDER' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <Briefcase className="h-8 w-8 mb-2" />
                                        <span className="text-sm font-bold">Trabajar</span>
                                        <span className="text-[10px] text-gray-500 mt-1">Ofrezco servicios</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Provider-specific questions */}
                    <div className={`transition-all duration-500 ease-in-out ${step === 3 ? 'opacity-100 translate-x-0' : 'opacity-0 absolute translate-x-full pointer-events-none'}`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Detalles profesionales</h3>
                        <p className="text-sm text-gray-500 mb-6">Ayúdanos a mostrarte mejor ante los que buscan servicios.</p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Tag size={14} className="inline mr-1" />
                                    Especialidad / Categoría
                                </label>
                                <select
                                    value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                                    className="block w-full px-4 py-2.5 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none bg-white"
                                >
                                    <option value="">Selecciona tu especialidad...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Movilidad y disponibilidad</label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox" checked={hasVehicle} onChange={(e) => setHasVehicle(e.target.checked)}
                                        className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                                    />
                                    <Car size={18} className="text-gray-600" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-800">Cuento con vehículo propio</span>
                                        <p className="text-[11px] text-gray-500">Para trasladarme al lugar de trabajo</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox" checked={canTravel} onChange={(e) => setCanTravel(e.target.checked)}
                                        className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                                    />
                                    <Navigation size={18} className="text-gray-600" />
                                    <div>
                                        <span className="text-sm font-medium text-gray-800">Puedo viajar a otros municipios</span>
                                        <p className="text-[11px] text-gray-500">Disponibilidad para trabajar fuera de mi zona</p>
                                    </div>
                                </label>
                            </div>

                            {canTravel && (
                                <div className="transition-all duration-300">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalles de movilidad</label>
                                    <textarea
                                        value={travelDetails} onChange={(e) => setTravelDetails(e.target.value)}
                                        rows={2}
                                        className="block w-full px-4 py-2.5 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                        placeholder="Ej: Puedo viajar a departamentos cercanos, cobro tarifa extra según distancia..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    <div className="mt-8 flex items-center justify-between">
                        {step > 1 ? (
                            <button
                                type="button" onClick={prevStep}
                                className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Atrás
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 || (step === 2 && role === 'CLIENT') ? (
                            <button
                                type="button" onClick={nextStep}
                                disabled={!canAdvance()}
                                className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-40 transition-colors"
                            >
                                {step === 2 && role === 'CLIENT' ? 'Registrarse' : 'Siguiente'}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                        ) : (
                            <button
                                type="button" onClick={handleSubmit}
                                disabled={!canAdvance()}
                                className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-40 transition-colors"
                            >
                                Registrarse
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
