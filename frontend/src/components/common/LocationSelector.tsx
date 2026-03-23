import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { departments } from '../../utils/guatemalaLocations';

export interface LocationData {
    department: string;
    municipality: string;
    location: string;
    lat: number | null;
    lng: number | null;
}

interface LocationSelectorProps {
    onLocationChange: (data: LocationData) => void;
    initialData?: Partial<LocationData>;
    label?: string;
}

const LocationSelector = ({ onLocationChange, initialData, label = "Ubicación del Servicio" }: LocationSelectorProps) => {
    const [department, setDepartment] = useState(initialData?.department || '');
    const [municipality, setMunicipality] = useState(initialData?.municipality || '');
    const [locationInput, setLocationInput] = useState(initialData?.location || '');
    const [lat, setLat] = useState<number | null>(initialData?.lat || null);
    const [lng, setLng] = useState<number | null>(initialData?.lng || null);
    const [gettingLocation, setGettingLocation] = useState(false);

    // List of municipalities based on selected department
    const availableMunicipalities = departments.find(d => d.name === department)?.municipalities || [];

    const lastSentData = useRef('');

    // Trigger parent callback when things change
    useEffect(() => {
        const newData = {
            department,
            municipality,
            location: locationInput,
            lat,
            lng
        };
        const newDataStr = JSON.stringify(newData);
        
        if (lastSentData.current !== newDataStr) {
            lastSentData.current = newDataStr;
            onLocationChange(newData);
        }
    }, [department, municipality, locationInput, lat, lng, onLocationChange]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalización no es soportada por tu navegador');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLat(position.coords.latitude);
                setLng(position.coords.longitude);
                setGettingLocation(false);
                alert('Ubicación obtenida con éxito. Esto ayudará a mostrar tu anuncio a personas cercanas.');
            },
            (error) => {
                console.error("Error getting location: ", error);
                setGettingLocation(false);
                alert('No pudimos acceder a tu ubicación. Por favor permite el acceso en tu navegador.');
            }
        );
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-bold text-gray-800 flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-yellow-500" />
                    {label}
                </h4>
                <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="text-xs flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-1.5 px-3 rounded-full transition-colors disabled:opacity-50"
                >
                    <Navigation className={`h-3 w-3 mr-1.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                    {lat && lng ? 'Ubicación Guardada' : (gettingLocation ? 'Obteniendo...' : 'Usar mi GPS')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Departamento</label>
                    <select
                        value={department}
                        onChange={(e) => {
                            setDepartment(e.target.value);
                            setMunicipality(''); // Reset municipality when department changes
                        }}
                        className="block w-full px-3 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none bg-white"
                        required
                    >
                        <option value="">Selecciona un departamento...</option>
                        {departments.map((dept) => (
                            <option key={dept.name} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Municipio</label>
                    <select
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        disabled={!department}
                        className="block w-full px-3 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                        required
                    >
                        <option value="">Selecciona un municipio...</option>
                        {availableMunicipalities.map((muni) => (
                            <option key={muni} value={muni}>{muni}</option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
                        Dirección Específica / Zona (Opcional)
                    </label>
                    <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Ej. Zona 1, frente al parque central..."
                        className="block w-full px-3 py-2 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm border-gray-300 border shadow-sm outline-none bg-white"
                    />
                </div>
            </div>
        </div>
    );
};

export default LocationSelector;
