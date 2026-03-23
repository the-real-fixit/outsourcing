import { useAuth } from '../context/AuthContext';
import { Briefcase, Star, Clock, CheckCircle, PlusCircle, MapPin } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutGrid, List as ListIcon } from 'lucide-react';
import api from '../services/api';

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

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'feed' | 'my-ads'>('feed');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [profileStats, setProfileStats] = useState({ rating: 0, jobsCompleted: 0, hours: 0 });
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
                        setProfileStats({
                            rating: profile.rating || 0,
                            jobsCompleted: profile.jobsCompleted || 0,
                            hours: profile.hours || 0,
                        });
                        const params = new URLSearchParams();
                        if (profile.lat) params.append('lat', profile.lat);
                        if (profile.lng) params.append('lng', profile.lng);
                        if (profile.department) params.append('department', profile.department);
                        if (profile.municipality) params.append('municipality', profile.municipality);
                        const queryStr = params.toString();
                        if (queryStr) locationQuery = `&${queryStr}`;
                    }
                } catch (e) {
                    // Profile might not exist yet
                }

                const endpoint = activeTab === 'feed'
                    ? `/job-posts?authorRole=CLIENT${locationQuery}${urlSearch ? `&search=${encodeURIComponent(urlSearch)}` : ''}${urlCategoryId ? `&categoryId=${urlCategoryId}` : ''}`
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
                <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex items-center space-x-6">
                    <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gray-100 border-2 border-yellow-400 flex items-center justify-center text-2xl font-bold text-gray-800 uppercase">
                        {user?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Bienvenido, {user?.name || 'Profesional'}</h1>
                        <p className="text-gray-600 font-medium flex items-center">
                            <Briefcase size={16} className="mr-2 text-yellow-600" />
                            Panel de Control Profesional
                        </p>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <Link
                            to="/app/create-job"
                            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                        >
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Publicar Anuncio
                        </Link>
                    </div>
                </div>
            </div>

            <main className="flex-1 py-8 px-4 max-w-5xl mx-auto w-full">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                        <div className="rounded-full bg-yellow-100 text-yellow-600 p-3 mr-4">
                            <Star size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Calificación</p>
                            <p className="text-2xl font-bold text-gray-800">{profileStats.rating.toFixed(1)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                        <div className="rounded-full bg-green-100 text-green-600 p-3 mr-4">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Trabajos Completados</p>
                            <p className="text-2xl font-bold text-gray-800">{profileStats.jobsCompleted}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
                        <div className="rounded-full bg-blue-100 text-blue-600 p-3 mr-4">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Horas Registradas</p>
                            <p className="text-2xl font-bold text-gray-800">{profileStats.hours}h</p>
                        </div>
                    </div>
                </div>

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
                            Oportunidades de Trabajo
                        </button>
                        <button
                            onClick={() => setActiveTab('my-ads')}
                            className={`${activeTab === 'my-ads'
                                ? 'border-yellow-500 text-yellow-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors`}
                        >
                            Mis Anuncios
                        </button>
                    </nav>
                </div>

                {/* Job Requests Feed */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">
                            {activeTab === 'feed' ? 'Oportunidades Disponibles' : 'Mis Anuncios Públicos'}
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
                        <div className="p-6 border-dashed border-gray-300 rounded-lg m-6 flex flex-col items-center justify-center text-center">
                            <div className="bg-gray-100 rounded-full p-4 mb-4">
                                <Briefcase className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-gray-700 font-medium text-lg mb-1">
                                {activeTab === 'feed' ? 'No hay solicitudes nuevas' : 'Aún no has publicado anuncios'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {activeTab === 'feed' ? 'Las oportunidades de trabajo aparecerán aquí.' : 'Publica tu primer anuncio y consigue clientes.'}
                            </p>
                        </div>
                    ) : (
                        <div className={viewMode === 'list'
                            ? "divide-y divide-gray-100"
                            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6"}>
                            {jobPosts.map((post) => (
                                <div key={post.id} onClick={() => navigate(`/app/job-posts/${post.id}`)} className={`block group cursor-pointer transition-all duration-200 ${viewMode === 'list' ? 'p-6 hover:bg-gray-50' : 'bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col h-full'}`}>

                                    {/* Grid View specific Image Cover */}
                                    {viewMode === 'grid' && post.photos && post.photos.length > 0 && (
                                        <div className="w-full h-40 bg-gray-200 border-b border-gray-100 relative overflow-hidden">
                                            <img src={post.photos[0]} alt="Ad cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${viewMode === 'list' ? 'md:flex-row md:items-start gap-4' : 'p-5 flex-1'}`}>

                                        {/* List View specific Image Cover */}
                                        {viewMode === 'list' && post.photos && post.photos.length > 0 && (
                                            <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden border border-gray-200 relative">
                                                <img src={post.photos[0]} alt="Ad cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}

                                        <div className="flex-1 flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                <h3 className={`font-bold text-gray-900 group-hover:text-yellow-600 transition-colors ${viewMode === 'list' ? 'text-lg' : 'text-base line-clamp-2'}`}>{post.title}</h3>
                                                {post.budget && <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm whitespace-nowrap flex-shrink-0">Q{post.budget}</span>}
                                            </div>
                                            <div className="text-xs text-yellow-600 font-bold tracking-wide uppercase mb-2">
                                                {post.category?.name || 'General'}
                                            </div>
                                            <p className={`text-gray-500 text-sm mb-4 ${viewMode === 'grid' ? 'line-clamp-3' : ''}`}>{post.description}</p>

                                            <div className={`mt-auto pt-4 border-t border-gray-50 ${viewMode === 'grid' ? 'flex flex-col gap-3' : 'flex items-center justify-between'}`}>
                                                <div className="flex flex-wrap items-center text-xs text-gray-400 gap-2">
                                                    <Link
                                                        to={`/app/public-profile/${post.author?.id}`}
                                                        onClick={e => e.stopPropagation()}
                                                        className="flex items-center font-medium text-gray-600 hover:text-yellow-600 transition-colors"
                                                    >
                                                        {post.author?.name}
                                                    </Link>
                                                {viewMode === 'list' && (post.municipality || post.department || post.location) && <span className="text-gray-300">|</span>}
                                            </div>

                                            {viewMode === 'grid' && (post.municipality || post.department || post.location) && (
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <MapPin size={12} className="text-red-500 mr-1" />
                                                    {post.municipality && post.department 
                                                        ? `${post.municipality}, ${post.department}` 
                                                        : post.location}
                                                </div>
                                            )}

                                            </div>
                                        </div>
                                    </div>

                                    {/* Only show Contact button in list view feed for quick action, grid view relies on full card click */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
};

export default EmployeeDashboard;
