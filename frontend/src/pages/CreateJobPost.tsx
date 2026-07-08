import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FilePlus, X, ImagePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationSelector from '../components/common/LocationSelector';
import { uploadFileToCloudinary, validateImageFile } from '../utils/uploadHelper';

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
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


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
            setFileError(null);

            const validFiles: File[] = [];
            for (const file of newFiles) {
                try {
                    validateImageFile(file);
                    validFiles.push(file);
                } catch (err: any) {
                    setFileError(err.message);
                    return; // Stop processing on first invalid file
                }
            }

            setSelectedFiles(prev => {
                const existingNames = new Set(prev.map(f => f.name));
                const uniqueNewFiles = validFiles.filter(f => !existingNames.has(f.name));
                const merged = [...prev, ...uniqueNewFiles];

                // Generate previews for new files
                uniqueNewFiles.forEach(file => {
                    const url = URL.createObjectURL(file);
                    setFilePreviews(prevPreviews => [...prevPreviews, url]);
                });

                return merged;
            });

            // Reset input so the same file can be re-added after removal
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setFilePreviews(prev => {
            URL.revokeObjectURL(prev[index]); // Free memory
            return prev.filter((_, i) => i !== index);
        });
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFileError(null);
        try {
            // Upload files individually, collecting any per-file errors
            const uploadedPhotos: string[] = [];
            const uploadErrors: string[] = [];

            for (const file of selectedFiles) {
                try {
                    const url = await uploadFileToCloudinary(file);
                    uploadedPhotos.push(url);
                } catch (err: any) {
                    uploadErrors.push(`• ${file.name}: ${err.message}`);
                }
            }

            if (uploadErrors.length > 0) {
                setFileError(`No se pudieron subir las siguientes imágenes:\n${uploadErrors.join('\n')}`);
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                photos: uploadedPhotos
            };

            await api.post('/job-posts', payload);
            alert('¡Anuncio publicado exitosamente!');
            navigate('/app');
        } catch (error: any) {
            console.error('Error posting job:', error);
            const errMsg = error?.response?.data?.message || error.message || 'Error desconocido';
            alert(`No se pudo publicar el anuncio.\nDetalle: ${errMsg}`);
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
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                Imágenes de referencia
                            </label>

                            {/* Drop zone / button */}
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-1 flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                            >
                                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-yellow-600">Haz clic para agregar imágenes</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    JPG, PNG, WEBP, GIF, BMP, SVG, TIFF, AVIF, HEIC — hasta 10 MB por imagen
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                id="photos"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Error message */}
                            {fileError && (
                                <p className="mt-2 text-sm text-red-600 whitespace-pre-line">
                                    {fileError}
                                </p>
                            )}

                            {/* Thumbnail previews */}
                            {selectedFiles.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-100">
                                            <img
                                                src={filePreviews[i]}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                title="Quitar imagen"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                {file.name}
                                            </div>
                                        </div>
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
