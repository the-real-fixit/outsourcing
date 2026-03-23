import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import api from '../services/api';
import { MapPin, ArrowLeft, LayoutGrid, List as ListIcon } from 'lucide-react';

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
        id: string;
        name: string;
    } | null;
    photos: string[];
}

interface Category {
    id: string;
    name: string;
}

const iconMapping: Record<string, string> = {
    'Electricista': 'Zap',
    'Plomería': 'Wrench',
    'Pintura': 'Paintbrush',
    'Carpintería': 'Hammer',
    'Mudanza': 'Truck',
    'Jardinería': 'Scissors',
    'Técnico': 'Monitor',
    'Albañil': 'Hammer',
    'Paseo de mascotas': 'Dog',
    'Cuidado de mascotas': 'PawPrint',
    'Limpieza': 'Sparkles',
    'Fotografía': 'Camera',
    'Clases': 'GraduationCap',
};

const CategoryPage = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

    useEffect(() => {
        if (!categoryId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch category name
                const catRes = await api.get(`/categories/${categoryId}`);
                setCategory(catRes.data);
            } catch {
                // fallback — try to get name from job posts
            }

            try {
                const res = await api.get(`/job-posts?authorRole=PROVIDER&categoryId=${categoryId}`);
                setJobPosts(res.data);
            } catch (e) {
                console.error('Error fetching category posts', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId]);

    const iconStr = category ? (iconMapping[category.name] || 'Wrench') : 'Wrench';
    const IconComponent = (Icons as any)[iconStr] || Icons.Wrench;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center shadow-sm">
                            <IconComponent className="h-5 w-5 text-gray-800" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                                {category?.name ?? 'Categoría'}
                            </h1>
                            {!loading && (
                                <p className="text-sm text-gray-500">
                                    {jobPosts.length} {jobPosts.length === 1 ? 'anuncio' : 'anuncios'} disponibles
                                </p>
                            )}
                        </div>
                    </div>

                    {/* View toggle — pushed to the right */}
                    <div className="ml-auto flex bg-white border border-gray-200 rounded-md overflow-hidden">
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
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-300 animate-pulse" />
                        <p className="text-gray-500 font-medium">Cargando anuncios...</p>
                    </div>
                ) : jobPosts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 gap-4 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                            <IconComponent className="h-10 w-10 text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700">Sin anuncios por ahora</h2>
                        <p className="text-gray-500 max-w-sm">
                            No hay profesionales ofreciendo servicios de <strong>{category?.name}</strong> en este momento.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={viewMode === 'list'
                            ? 'divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white'
                            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}
                    >
                        {jobPosts.map((post, i) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <div
                                    onClick={() => navigate(`/app/job-posts/${post.id}`)}
                                    className={`cursor-pointer ${viewMode === 'list'
                                        ? 'block p-6 hover:bg-gray-50 transition-colors'
                                        : 'bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col'}`}
                                >
                                    <div className={viewMode === 'list' ? 'flex flex-col md:flex-row md:items-start gap-4' : 'flex flex-col h-full'}>

                                        {/* Grid image */}
                                        {viewMode === 'grid' && post.photos?.length > 0 && (
                                            <div className="w-full h-40 bg-gray-200 overflow-hidden border-b border-gray-100">
                                                <img src={post.photos[0]} alt="Ad cover" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}

                                        {/* List image */}
                                        {viewMode === 'list' && post.photos?.length > 0 && (
                                            <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                                                <img src={post.photos[0]} alt="Ad cover" className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        <div className={viewMode === 'list' ? 'flex-1' : 'p-6 flex flex-col flex-1'}>
                                            <div className="flex items-start justify-between mb-4 gap-2">
                                                <Link
                                                    to={`/app/public-profile/${post.author?.id}`}
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
                                                        <h3 className="text-sm font-bold text-gray-900">{post.author?.name}</h3>
                                                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </Link>
                                                <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                                                    {post.category?.name || 'General'}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <h4 className={`font-bold text-gray-900 ${viewMode === 'list' ? 'text-lg' : 'text-base'}`}>{post.title}</h4>
                                                {viewMode === 'list' && post.budget && (
                                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded text-sm whitespace-nowrap flex-shrink-0">Q{post.budget}</span>
                                                )}
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
                                                {viewMode === 'grid' && post.budget && (
                                                    <span className="font-bold text-green-600">Q{post.budget}</span>
                                                )}

                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default CategoryPage;
