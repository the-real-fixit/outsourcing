import { useEffect, useState } from 'react';
import { Star, Briefcase, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Ad {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    type: 'JOB' | 'PROFILE' | 'PROMOTED';
    targetId: string;
    isPromoted: boolean;
    categoryName?: string;
    authorRole?: string;
}

interface HighlightedAdsProps {
    authorRole?: 'CLIENT' | 'PROVIDER';
}

const HighlightedAds = ({ authorRole }: HighlightedAdsProps) => {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAds = async () => {
            try {
                // Assuming the backend is running on the same host/port proxied or configured base URL
                // If not, we might need an env var. For now hardcode or use relative if proxy setup.
                // Given the context, I'll use the VITE_API_URL or default to localhost:3000
                const updatedUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                const endpoint = authorRole
                    ? `${updatedUrl}/ads/highlighted?authorRole=${authorRole}`
                    : `${updatedUrl}/ads/highlighted`;
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    setAds(data);
                }
            } catch (error) {
                console.error('Error fetching highlighted ads:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    if (loading) {
        return <div className="py-8 text-center">Cargando anuncios...</div>;
    }

    if (ads.length === 0) {
        return null; // Don't show section if no ads
    }

    const handleCardClick = (ad: Ad) => {
        // If not authenticated, we could redirect to login instead of trying to view details
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        if (ad.type === 'JOB') {
            navigate(`/app/job-posts/${ad.targetId}`);
        } else if (ad.type === 'PROFILE') {
            navigate(`/app/public-profile/${ad.targetId}`);
        } else if (ad.type === 'PROMOTED' && ad.targetId) {
            navigate(`/app/job-posts/${ad.targetId}`);
        }
    };

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Destacados</h2>
                    {/* <a href="/search" className="text-blue-600 hover:underline text-sm font-medium">Ver todos</a> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ads.map((ad) => (
                        <div
                            key={ad.id}
                            onClick={() => handleCardClick(ad)}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden cursor-pointer group"
                        >
                            <div className="h-48 bg-gray-200 relative overflow-hidden">
                                {ad.imageUrl ? (
                                    <img
                                        src={ad.imageUrl}
                                        alt={ad.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-300">
                                        {ad.type === 'PROFILE' ? <User size={48} /> : <Briefcase size={48} />}
                                    </div>
                                )}

                                {ad.isPromoted && (
                                    <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                                        <Star size={12} className="mr-1 fill-yellow-900" />
                                        Destacado
                                    </div>
                                )}

                                {ad.categoryName && (
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                                        {ad.categoryName}
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                    {ad.title}
                                </h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-3 h-10">
                                    {ad.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-3 border-t border-gray-50">
                                    <span className="flex items-center">
                                        {ad.type === 'PROFILE' ? 'Perfil Profesional' : 'Oportunidad Laboral'}
                                    </span>
                                    <ExternalLink size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HighlightedAds;
