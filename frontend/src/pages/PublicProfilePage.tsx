import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Phone, MessageSquare, Star, ArrowLeft, UserCircle, MapPin, CheckCircle, Car, Navigation } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Review {
    id: string;
    content: string;
    rating: number;
    createdAt: string;
    author: {
        id: string;
        name: string;
        profile: { photoUrl: string | null } | null;
    };
}

interface Observation {
    id: string;
    content: string;
    createdAt: string;
}

interface PublicProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    profile: {
        bio?: string;
        photoUrl?: string;
        phone?: string;
        address?: string;
        department?: string;
        municipality?: string;
        rating?: number;
        jobsCompleted?: number;
        canTravel?: boolean;
        hasVehicle?: boolean;
        travelDetails?: string;
        category?: {
            name: string;
        };
        reviewsReceived: Review[];
        profileObservations: Observation[];
    } | null;
}

const PublicProfilePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPhone, setShowPhone] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/public/${id}`);
                setProfileData(response.data);
            } catch (error) {
                console.error("Error fetching public profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando perfil...</div>;
    }

    if (!profileData) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-xl text-gray-600 mb-4">Perfil no encontrado</p>
                <button onClick={() => navigate(-1)} className="text-yellow-600 hover:underline">
                    Volver
                </button>
            </div>
        );
    }

    const { name, profile } = profileData;
    const bioLines = profile?.bio ? profile.bio.split('\n') : ['Sin descripción proporcionada.'];
    const rating = profile?.rating || 0;
    const reviews = profile?.reviewsReceived || [];
    const observations = profile?.profileObservations || [];

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex flex-row items-center text-gray-600 hover:text-black font-medium transition-colors"
            >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Regresar
            </button>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
                {/* Left Column: Photo & Stars */}
                <div className="flex flex-col items-center w-full md:w-1/3 max-w-[300px] shrink-0">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-6 flex items-center justify-center border-4 border-yellow-400">
                        {profile?.photoUrl ? (
                            <img src={profile.photoUrl} alt={`Foto de ${name}`} className="w-full h-full object-cover" />
                        ) : (
                            <UserCircle className="w-32 h-32 text-gray-400" />
                        )}
                    </div>
                    <div className="flex gap-1 justify-center mb-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Star
                                key={i}
                                className={`w-7 h-7 ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{rating.toFixed(1)} / 5.0</p>

                    {/* Stats */}
                    <div className="mt-4 w-full space-y-2">
                        <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="flex items-center text-sm text-gray-600">
                                <CheckCircle size={14} className="mr-2 text-green-500" />
                                Trabajos
                            </span>
                            <span className="font-bold text-gray-900">{profile?.jobsCompleted || 0}</span>
                        </div>

                        {profile?.hasVehicle && (
                            <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg text-sm text-blue-700">
                                <Car size={14} className="mr-2" />
                                Cuenta con vehículo propio
                            </div>
                        )}

                        {profile?.canTravel && (
                            <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg text-sm text-green-700">
                                <Navigation size={14} className="mr-2" />
                                Disponible para viajar
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Column: Details & Bio */}
                <div className="flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-200 pb-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">{name}</h1>
                            <p className="text-gray-600 mt-1 flex items-center">
                                <MapPin size={14} className="mr-1 text-gray-400" />
                                {profile?.municipality && profile?.department
                                    ? `${profile.municipality}, ${profile.department}`
                                    : profile?.address || 'Ubicación no especificada'}
                            </p>
                            {profile?.category && (
                                <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                                    {profile.category.name}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-4 sm:mt-0">
                            {/* Phone Reveal */}
                            <div className="flex flex-col items-end">
                                {showPhone && profile?.phone ? (
                                    <span className="text-sm font-bold text-gray-800 mb-1">+502 {profile.phone}</span>
                                ) : null}
                                <button
                                    onClick={() => setShowPhone(!showPhone)}
                                    className="p-3 bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-yellow-700 rounded-full transition-colors"
                                    title={showPhone ? "Ocultar teléfono" : "Ver teléfono"}
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                            </div>
                            {/* Chat */}
                            {user && id && (
                                <Link
                                    to={`/app/chats/${id}`}
                                    className="p-3 bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-yellow-700 rounded-full transition-colors"
                                    title="Enviar mensaje"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Acerca de mí</h2>
                            <div className="text-gray-700 leading-relaxed text-base space-y-2">
                                {bioLines.map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>

                        {profile?.travelDetails && (
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-2">Movilidad</h2>
                                <p className="text-gray-700 leading-relaxed text-base">{profile.travelDetails}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Observations & Reviews from DB */}
                <div className="w-full md:w-1/3 lg:w-[320px] shrink-0 space-y-8">
                    {/* Observations */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Observaciones</h2>
                        {observations.length === 0 ? (
                            <p className="text-sm text-gray-500">Sin observaciones aún.</p>
                        ) : (
                            <div className="space-y-3">
                                {observations.map(obs => (
                                    <div key={obs.id} className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
                                        {obs.content}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reviews / Comments */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Comentarios</h2>
                        {reviews.length === 0 ? (
                            <p className="text-sm text-gray-500">Sin comentarios aún.</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    {review.author.profile?.photoUrl ? (
                                                        <img src={review.author.profile.photoUrl} alt={review.author.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserCircle size={16} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="font-bold text-sm text-gray-900">{review.author.name}</span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <Star key={i} size={12} className={i <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.content && (
                                            <p className="text-sm text-gray-700">{review.content}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfilePage;
