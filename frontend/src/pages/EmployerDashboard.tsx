import { useEffect, useState } from 'react';
import CategoryCarousel from '../components/landing/CategoryCarousel';
import HighlightedAds from '../components/landing/HighlightedAds';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, LayoutGrid, List as ListIcon, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

interface JobPost {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    location: string | null;
    department: string | null;
    municipality: string | null;
    createdAt: string;
    author: {
        id: string;
        name: string;
        profile: {
            photoUrl: string | null;
        } | null;
    };
    category: {
        name: string;
    } | null;
    photos: string[];
}

// Inline photo carousel for ad cards
const PhotoCarousel = ({ photos, onClick }: { photos: string[]; onClick?: () => void }) => {
    const [idx, setIdx] = useState(0);
    if (!photos || photos.length === 0) return null;
    const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); };
    const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); };
    return (
        <div className="relative w-full h-44 bg-gray-200 overflow-hidden border-b border-gray-100 group/carousel" onClick={onClick}>
            <img
                src={photos[idx]}
                alt={`foto ${idx + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
            />
            {photos.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                        {photos.map((_, i) => (
                            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const EmployerDashboard = () => {
    const { user } = useAuth();
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'feed' | 'my-ads'>('feed');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const urlSearch = searchParams.get('search') || '';
    const urlCategoryId = searchParams.get('categoryId') || '';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let locationQuery = '';
                try {
                    const profileRes = await api.get('/users/profile');
                    const profile = profileRes.data?.profile;
                    if (profile) {
                        const params = new URLSearchParams();
                        if (profile.lat) params.append('lat', profile.lat);
                        if (profile.lng) params.append('lng', profile.lng);
                        if (profile.department) params.append('department', profile.department);
                        if (profile.municipality) params.append('municipality', profile.municipality);
                        const queryStr = params.toString();
                        if (queryStr) locationQuery = `&${queryStr}`;
                    }
                } catch (e) {
                    // Profile might not exist yet, proceed without location sorting
                }

                const endpoint = activeTab === 'feed'
                    ? `/job-posts?authorRole=PROVIDER${locationQuery}${urlSearch ? `&search=${encodeURIComponent(urlSearch)}` : ''}${urlCategoryId ? `&categoryId=${urlCategoryId}` : ''}`
                    : `/job-posts?authorId=${user?.id}`;

                const response = await api.get(endpoint);
                setJobPosts(response.data);
            } catch (error) {
                console.error('Error fetching job posts', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [activeTab, user, urlSearch, urlCategoryId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Clean Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
                            Empleador
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Hola {user?.name || 'Usuario'}, aquí puedes buscar y gestionar tus proyectos.
                        </p>
                    </div>
                    <Link
                        to="/app/create-job"
                        className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Publicar Anuncio
                    </Link>
                </div>
            </div>

            <main className="flex-1 py-8 px-4 max-w-7xl mx-auto w-full">
                {/* Categories */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Categorías Populares</h2>
                    <CategoryCarousel />
                </section>

                {/* Tabs Indicator */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`${activeTab === 'feed'
                                ? 'border-yellow-500 text-yellow-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors`}
                        >
                            Buscar Profesionales
                        </button>
                        <button
                            onClick={() => setActiveTab('my-ads')}
                            className={`${activeTab === 'my-ads'
                                ? 'border-yellow-500 text-yellow-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors`}
                        >
                            Mis Anuncios Publicados
                        </button>
                    </nav>
                </div>

                {/* Job Posts Grid */}
                <section className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {activeTab === 'feed' ? 'Anuncios de Profesionales Disponibles' : 'Mis Anuncios Activos'}
                        </h2>
                        <div className="flex bg-white border border-gray-200 rounded-md overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 focus:outline-none transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                title="Vista de lista"
                            >
                                <ListIcon size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 focus:outline-none transition-colors border-l border-gray-200 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                title="Vista de cuadrícula"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-center text-gray-500 py-10">Cargando anuncios...</div>
                    ) : jobPosts.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm border border-gray-100">
                            {activeTab === 'feed' ? 'No hay profesionales ofreciendo servicios en este momento.' : 'Aún no has publicado ningún requerimiento de trabajo.'}
                        </div>
                    ) : (
                        <div className={viewMode === 'list'
                            ? "divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white"
                            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                            {jobPosts.map((post) => (
                                <div
                                    key={post.id}
                                    onClick={() => navigate(`/app/job-posts/${post.id}`)}
                                    className={`cursor-pointer ${viewMode === 'list'
                                        ? 'block p-6 hover:bg-gray-50 transition-colors'
                                        : 'bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col'
                                    }`}
                                >
                                    <div className={viewMode === 'list' ? "flex flex-col md:flex-row md:items-start gap-4" : "flex flex-col h-full"}>

                                        {/* Grid View — Photo Carousel */}
                                        {viewMode === 'grid' && post.photos && post.photos.length > 0 && (
                                            <PhotoCarousel photos={post.photos} />
                                        )}

                                        {/* List View Image */}
                                        {viewMode === 'list' && post.photos && post.photos.length > 0 && (
                                            <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                                                <img src={post.photos[0]} alt="Ad cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}

                                        <div className={viewMode === 'list' ? "flex-1" : "p-6 flex flex-col flex-1"}>
                                            <div className="flex items-start justify-between mb-4 gap-2">
                                                <Link
                                                    to={`/app/public-profile/${post.author.id}`}
                                                    onClick={e => e.stopPropagation()}
                                                    className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
                                                        {post.author?.profile?.photoUrl ? (
                                                            <img src={post.author.profile.photoUrl} alt={post.author.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">
                                                                {post.author?.name?.charAt(0) || 'U'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">{post.author?.name}</h3>
                                                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </Link>
                                                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                                                    {post.category?.name || 'General'}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <h4 className={`font-bold text-gray-900 group-hover:text-yellow-600 transition-colors ${viewMode === 'list' ? 'text-lg' : 'text-base'}`}>{post.title}</h4>
                                                {viewMode === 'list' && post.budget && <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm whitespace-nowrap flex-shrink-0">Q{post.budget}</span>}
                                            </div>

                                            <p className={`text-gray-600 text-sm mb-4 ${viewMode === 'grid' ? 'line-clamp-3 flex-1' : ''}`}>{post.description}</p>

                                            <div className={`flex items-center justify-between mt-auto ${viewMode === 'list' ? 'pt-4 border-t border-gray-50' : 'mb-4'}`}>
                                                <div className="flex items-center text-xs text-gray-500">
                                                    {(post.municipality || post.department || post.location) && (
                                                        <span className="flex items-center">
                                                            <MapPin size={12} className="text-red-500 mr-1" />
                                                            {post.municipality && post.department 
                                                                ? `${post.municipality}, ${post.department}` 
                                                                : post.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {viewMode === 'grid' && post.budget && <span className="font-bold text-green-600">Q{post.budget}</span>}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <div className="mt-auto">
                <HighlightedAds authorRole="PROVIDER" />
            </div>
        </div>
    );
};

export default EmployerDashboard;
