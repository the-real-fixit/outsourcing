import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Banknote, Calendar, User, ChevronLeft, Star, CheckCircle, PlayCircle, XCircle, Car, Navigation, FileText, X, Clock, Send } from 'lucide-react';

interface JobPost {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    location: string | null;
    department: string | null;
    municipality: string | null;
    photos: string[];
    createdAt: string;
    author: {
        id: string;
        name: string;
        role: string;
        profile: {
            photoUrl: string | null;
            phone: string | null;
            rating: number;
            jobsCompleted: number;
            address: string | null;
            canTravel: boolean;
            hasVehicle: boolean;
            travelDetails: string | null;
            department: string | null;
            municipality: string | null;
            bio: string | null;
            reviewsReceived: {
                id: string;
                content: string;
                rating: number;
                createdAt: string;
                author: { id: string; name: string; profile: { photoUrl: string | null } | null };
            }[];
        } | null;
    };
    category: {
        name: string;
    } | null;
    status: string;
}

const JobPostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [post, setPost] = useState<JobPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Offer form
    const [showOfferForm, setShowOfferForm] = useState(false);
    const [offerDescription, setOfferDescription] = useState('');
    const [offerPrice, setOfferPrice] = useState('');
    const [offerDays, setOfferDays] = useState('');
    const [submittingOffer, setSubmittingOffer] = useState(false);
    const [offerSent, setOfferSent] = useState(false);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await api.get(`/job-posts/${id}`);
                setPost(response.data);
            } catch (error) {
                console.error("Error fetching job post details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPost();
        }
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex justify-center py-20">Cargando detalles...</div>;
    }

    if (!post) {
        return <div className="min-h-screen bg-gray-50 flex justify-center py-20">Anuncio no encontrado.</div>;
    }

    const isAuthor = user?.id === post.author.id;

    const handleStatusChange = async (newStatus: string) => {
        setUpdatingStatus(true);
        try {
            await api.patch(`/job-posts/${id}/status`, { status: newStatus });
            setPost(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleOfferSubmit = async () => {
        if (!offerDescription.trim() || !offerPrice) return;
        setSubmittingOffer(true);
        try {
            await api.post(`/job-posts/${id}/offer`, {
                description: offerDescription,
                price: parseFloat(offerPrice),
                estimatedDays: offerDays ? parseInt(offerDays) : null
            });
            setOfferSent(true);
            setShowOfferForm(false);
        } catch (error) {
            console.error('Error sending offer:', error);
            alert('Error al enviar la oferta.');
        } finally {
            setSubmittingOffer(false);
        }
    };

    const statusLabels: Record<string, { label: string, color: string, icon: React.ElementType }> = {
        OPEN: { label: 'Abierto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
        IN_PROGRESS: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
        CLOSED: { label: 'Completado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    const statusInfo = statusLabels[post.status] || statusLabels.OPEN;
    const StatusIcon = statusInfo.icon;

    const authorProfile = post.author.profile;
    const reviews = authorProfile?.reviewsReceived || [];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <Link to={-1 as any} className="inline-flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700 mb-6">
                    <ChevronLeft size={16} className="mr-1" />
                    Volver
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                            {/* Header Image / Photos */}
                            {post.photos && post.photos.length > 0 && (
                                <div className="w-full h-64 sm:h-96 bg-gray-200 border-b border-gray-100 overflow-x-auto flex snap-x snap-mandatory">
                                    {post.photos.map((photo, index) => (
                                        <img
                                            key={index}
                                            src={photo}
                                            alt={`Foto ${index + 1}`}
                                            className="h-full w-full sm:w-auto object-cover snap-center flex-shrink-0"
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="px-6 py-8 sm:px-10">
                                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold mb-3 uppercase tracking-wide">
                                    {post.category?.name || 'General'}
                                </span>
                                <h1 className="text-3xl font-black text-gray-900 mb-2">{post.title}</h1>

                                <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4 mt-4">
                                    <div className="flex items-center">
                                        <Calendar size={16} className="mr-1 text-gray-400" />
                                        <span>Publicado el {new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={16} className="mr-1 text-red-500" />
                                        <span>
                                            {post.municipality && post.department
                                                ? `${post.municipality}, ${post.department}`
                                                : post.location || 'Ubicación no especificada'}
                                        </span>
                                    </div>
                                    {post.budget && (
                                        <div className="flex items-center font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                            <Banknote size={16} className="mr-1" />
                                            <span>Presupuesto: Q{post.budget}</span>
                                        </div>
                                    )}
                                    <span className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-bold ${statusInfo.color}`}>
                                        <StatusIcon size={14} className="mr-1" />
                                        {statusInfo.label}
                                    </span>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">Descripción del Anuncio</h2>
                                    <div className="prose prose-sm sm:prose lg:prose-lg text-gray-600 whitespace-pre-wrap">
                                        {post.description}
                                    </div>
                                </div>

                                {/* Author can mark as completed when IN_PROGRESS */}
                                {isAuthor && post.status === 'IN_PROGRESS' && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={() => handleStatusChange('CLOSED')}
                                            disabled={updatingStatus}
                                            className="inline-flex items-center px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
                                        >
                                            <CheckCircle size={18} className="mr-2" />
                                            {updatingStatus ? 'Actualizando...' : 'Marcar como Completado'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Author Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Author Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                {post.author.role === 'PROVIDER' ? 'Profesional' : 'Empleador'}
                            </h3>
                            <Link to={`/app/public-profile/${post.author.id}`} className="flex items-center mb-4 hover:opacity-80 transition-opacity group">
                                <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-yellow-400 shadow-sm flex-shrink-0">
                                    {authorProfile?.photoUrl ? (
                                        <img src={authorProfile.photoUrl} alt={post.author.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-7 w-7 text-gray-400" />
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className="text-base font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{post.author.name}</p>
                                    <div className="flex items-center text-xs mt-1 gap-0.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star key={i} size={12} className={i <= Math.round(authorProfile?.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                        ))}
                                        <span className="text-gray-400 ml-1">({authorProfile?.jobsCompleted || 0} trabajos)</span>
                                    </div>
                                </div>
                            </Link>

                            {/* Location */}
                            {(authorProfile?.municipality || authorProfile?.address) && (
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                    <MapPin size={14} className="mr-2 text-gray-400 flex-shrink-0" />
                                    {authorProfile?.municipality && authorProfile?.department
                                        ? `${authorProfile.municipality}, ${authorProfile.department}`
                                        : authorProfile?.address}
                                </div>
                            )}

                            {/* Vehicle/Travel */}
                            {authorProfile?.hasVehicle && (
                                <div className="flex items-center text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg mb-2">
                                    <Car size={14} className="mr-2 flex-shrink-0" />
                                    Cuenta con vehículo propio
                                </div>
                            )}
                            {authorProfile?.canTravel && (
                                <div className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-2">
                                    <Navigation size={14} className="mr-2 flex-shrink-0" />
                                    Disponible para viajar
                                </div>
                            )}
                            {authorProfile?.travelDetails && (
                                <p className="text-xs text-gray-500 mt-1 mb-3">{authorProfile.travelDetails}</p>
                            )}

                            {/* Bio snippet */}
                            {authorProfile?.bio && (
                                <p className="text-sm text-gray-600 mt-3 line-clamp-3 border-t border-gray-100 pt-3">{authorProfile.bio}</p>
                            )}

                            {/* Proposal button */}
                            {!isAuthor && user && post.status === 'OPEN' && !offerSent && (
                                <button
                                    onClick={() => setShowOfferForm(true)}
                                    className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center shadow-sm"
                                >
                                    <FileText size={18} className="mr-2" />
                                    {user.role === 'CLIENT' ? 'Enviar Propuesta' : 'Enviar Propuesta'}
                                </button>
                            )}
                            
                            {!isAuthor && user && post.status === 'OPEN' && offerSent && (
                                <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-200 text-center flex items-center justify-center">
                                    <CheckCircle size={16} className="text-green-600 mr-1" />
                                    <p className="text-sm font-bold text-green-700">Cotización enviada</p>
                                </div>
                            )}
                        </div>

                        {/* Reviews */}
                        {reviews.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Comentarios ({reviews.length})</h3>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {reviews.map(review => (
                                        <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {review.author.profile?.photoUrl ? (
                                                            <img src={review.author.profile.photoUrl} alt={review.author.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={12} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-xs text-gray-900">{review.author.name}</span>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(i => (
                                                        <Star key={i} size={10} className={i <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                                    ))}
                                                </div>
                                            </div>
                                            {review.content && <p className="text-xs text-gray-700 mt-1">{review.content}</p>}
                                            <p className="text-[10px] text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Offer Form Modal */}
            {showOfferForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
                        <button onClick={() => setShowOfferForm(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                        <h2 className="text-xl font-black text-gray-900 mb-1">
                            {user?.role === 'CLIENT' ? 'Propuesta de Contratación' : 'Propuesta de Trabajo'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Para: <b>{post.author.name}</b> — {post.title}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción del trabajo</label>
                                <textarea
                                    value={offerDescription}
                                    onChange={(e) => setOfferDescription(e.target.value)}
                                    rows={4}
                                    className="block w-full px-4 py-2.5 rounded-md border border-gray-300 text-sm focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                                    placeholder="Describe los detalles del trabajo, materiales, condiciones, horarios..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        <Banknote size={14} className="inline mr-1" />
                                        Precio propuesto (Q)
                                    </label>
                                    <input
                                        type="number"
                                        value={offerPrice}
                                        onChange={(e) => setOfferPrice(e.target.value)}
                                        className="block w-full px-4 py-2.5 rounded-md border border-gray-300 text-sm focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                                        placeholder="0.00"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        <Clock size={14} className="inline mr-1" />
                                        Días estimados
                                    </label>
                                    <input
                                        type="number"
                                        value={offerDays}
                                        onChange={(e) => setOfferDays(e.target.value)}
                                        className="block w-full px-4 py-2.5 rounded-md border border-gray-300 text-sm focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                                        placeholder="Opcional"
                                        min={1}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowOfferForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleOfferSubmit}
                                disabled={submittingOffer || !offerDescription.trim() || !offerPrice}
                                className="inline-flex items-center px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-md text-sm transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <Send size={16} className="mr-2" />
                                {submittingOffer ? 'Enviando...' : 'Enviar Propuesta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobPostDetail;
