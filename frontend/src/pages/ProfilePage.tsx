import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Save, User as UserIcon, Upload, Check } from 'lucide-react';
import LocationSelector from '../components/common/LocationSelector';

const ProfilePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: '',
        phone: '',
        address: '',
        department: '',
        municipality: '',
        lat: null as number | null,
        lng: null as number | null,
        categoryId: '',
        photoUrl: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, catRes] = await Promise.all([
                    api.get('/users/profile'),
                    api.get('/categories')
                ]);

                const profile = profileRes.data?.profile || {};
                setFormData({
                    name: profileRes.data?.name || user?.name || '',
                    bio: profile.bio || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    department: profile.department || '',
                    municipality: profile.municipality || '',
                    lat: profile.lat || null,
                    lng: profile.lng || null,
                    categoryId: profile.categoryId || '',
                    photoUrl: profile.photoUrl || ''
                });
                setCategories(catRes.data);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/users/profile', formData);
            alert("Perfil actualizado correctamente");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Error al actualizar el perfil");
        } finally {
            setSaving(false);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip non-digits
        const digits = e.target.value.replace(/\D/g, '');
        // Format as ####-####
        let formatted = digits;
        if (digits.length > 4) {
            formatted = digits.slice(0, 4) + '-' + digits.slice(4, 8);
        }
        setFormData(prev => ({ ...prev, phone: formatted }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('files', file);
            const uploadRes = await api.post('/upload', formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const uploadedUrls: string[] = uploadRes.data.urls || [];
            if (uploadedUrls.length > 0) {
                setFormData(prev => ({ ...prev, photoUrl: uploadedUrls[0] }));
            }
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            alert('Error al subir la foto. Intenta de nuevo.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando perfil...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <div className="px-6 py-5 bg-yellow-300">
                    <h3 className="text-2xl font-black text-black">Mi Perfil</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-800 font-medium">Información personal y detalles de contacto.</p>
                </div>

                <form onSubmit={handleSubmit} className="border-t border-gray-200">
                    <div className="px-6 py-6 space-y-8">

                        {/* Profile Photo */}
                        <div className="flex items-center space-x-6">
                            <div className="flex-shrink-0 h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-yellow-400">
                                {formData.photoUrl ? (
                                    <img src={formData.photoUrl} alt="Perfil" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-12 w-12 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Foto de Perfil</label>
                                <label className="inline-flex items-center px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-md cursor-pointer transition-colors text-sm shadow-sm">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploadingPhoto ? 'Subiendo...' : 'Elegir Foto'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                        disabled={uploadingPhoto}
                                    />
                                </label>
                                {formData.photoUrl && (
                                    <p className="mt-2 text-xs text-green-600 font-medium flex items-center"><Check size={14} className="mr-1" /> Foto cargada correctamente</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6 border-t border-gray-100 pt-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                />
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">Teléfono de Contacto</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-bold">
                                        GT +502
                                    </span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                        maxLength={9}
                                        className="block w-full px-4 py-2 rounded-none rounded-r-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                        placeholder="1234-5678"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Formato: ####-####</p>
                            </div>

                            {user?.role === 'PROVIDER' && (
                                <div className="sm:col-span-6">
                                    <label htmlFor="categoryId" className="block text-sm font-bold text-gray-700 mb-1">Especialidad / Categoría Principal</label>
                                    <select
                                        id="categoryId"
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none bg-white"
                                    >
                                        <option value="">Selecciona tu especialidad...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="sm:col-span-6">
                                <LocationSelector
                                    label="Dirección de Trabajo o Residencia"
                                    onLocationChange={(data) => setFormData(prev => ({
                                        ...prev,
                                        department: data.department,
                                        municipality: data.municipality,
                                        address: data.location,
                                        lat: data.lat,
                                        lng: data.lng
                                    }))}
                                    initialData={{
                                        department: formData.department,
                                        municipality: formData.municipality,
                                        location: formData.address,
                                        lat: formData.lat,
                                        lng: formData.lng
                                    }}
                                />
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="bio" className="block text-sm font-bold text-gray-700 mb-1">Acerca de ti (Biografía)</label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={5}
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none"
                                    placeholder={user?.role === 'PROVIDER' ? "Describe tus habilidades, años de experiencia y por qué deberían contratarte..." : "Cuéntanos sobre ti preséntate ante la comunidad..."}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-bold rounded-md text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
                        >
                            {saving ? 'Guardando...' : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Guardar Perfil
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
