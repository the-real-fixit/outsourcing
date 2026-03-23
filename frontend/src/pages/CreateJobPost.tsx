import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FilePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationSelector from '../components/common/LocationSelector';

const CreateJobPost = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const isProvider = user?.role === 'PROVIDER';

    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        location: '',
        department: '',
        municipality: '',
        lat: null as number | null,
        lng: null as number | null,
        categoryId: '',
    });

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => {
                const existingNames = new Set(prev.map(f => f.name));
                const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
                return [...prev, ...uniqueNewFiles];
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // First upload files if any
            let uploadedPhotos: string[] = [];

            if (selectedFiles.length > 0) {
                const uploadData = new FormData();
                selectedFiles.forEach(file => {
                    uploadData.append('files', file);
                });

                const uploadRes = await api.post('/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedPhotos = uploadRes.data.urls; // Assuming endpoint returns { urls: string[] }
            }

            const payload = {
                ...formData,
                photos: uploadedPhotos
            };

            await api.post('/job-posts', payload);
            alert("¡Anuncio publicado exitosamente!");
            navigate('/app');
        } catch (error) {
            console.error("Error posting job:", error);
            alert("No se pudo publicar el anuncio o subir imágenes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="px-6 py-5 bg-yellow-300 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-black">
                            {isProvider ? 'Ofrecer mis servicios' : 'Publicar un Anuncio'}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-800 font-medium">
                            {isProvider
                                ? 'Describe los servicios que ofreces para que los clientes puedan contactarte.'
                                : 'Describe lo que necesitas y publicaremos tu anuncio para la comunidad profesional.'}
                        </p>
                    </div>
                    <FilePlus className="h-10 w-10 text-black opacity-80" />
                </div>

                <form onSubmit={handleSubmit} className="border-t border-gray-200">
                    <div className="px-6 py-6 space-y-6">

                        <div>
                            <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-1">Título del anuncio *</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                placeholder={isProvider ? 'Ej: Ofrezco servicios de plomería profesional' : 'Ej: Necesito un plomero urgente para fuga de agua'}
                            />
                        </div>

                        <div>
                            <label htmlFor="categoryId" className="block text-sm font-bold text-gray-700 mb-1">Categoría del servicio *</label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                required
                                value={formData.categoryId}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none bg-white"
                            >
                                <option value="">Selecciona la mejor categoría...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1">Descripción detallada *</label>
                            <textarea
                                id="description"
                                name="description"
                                required
                                rows={5}
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                placeholder={isProvider
                                    ? 'Describe tu experiencia, el tipo de trabajos que realizas y tus horarios disponibles.'
                                    : 'Describe con detalle el trabajo a realizar, horarios preferidos, tamaño del proyecto, etc.'}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {!isProvider && (
                                <div>
                                    <label htmlFor="budget" className="block text-sm font-bold text-gray-700 mb-1">Presupuesto estimado (opcional)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">Q</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="budget"
                                            id="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            className="block w-full pl-8 px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <LocationSelector
                                    onLocationChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="photos" className="block text-sm font-bold text-gray-700 mb-1">Imágenes de referencia</label>
                            <input
                                type="file"
                                id="photos"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                            />
                            <p className="mt-1 text-xs text-gray-500">Puedes seleccionar una o más imágenes desde tus archivos.</p>

                            {selectedFiles.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedFiles.map((file, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 gap-1">
                                            {file.name}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                                                title="Quitar imagen"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="px-6 py-4 bg-gray-50 flex flex-col-reverse justify-stretch sm:flex-row-reverse sm:justify-start gap-3">
                        <button
                            type="submit"
                            disabled={loading || !formData.title || !formData.description || !formData.categoryId}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-sm font-bold rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Publicando...' : 'Publicar Anuncio'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/app')}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-bold rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateJobPost;
