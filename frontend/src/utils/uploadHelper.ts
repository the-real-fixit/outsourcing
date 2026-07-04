import axios from 'axios';
import api from '../services/api';

/**
 * Uploads a file directly to Cloudinary using a secure signed request from the backend.
 * @param file The file to upload.
 * @returns The secure URL of the uploaded asset.
 */
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
    // 1. Request signature and credentials from NestJS backend
    const signatureRes = await api.get('/upload/signature');
    const { signature, timestamp, apiKey, cloudName, folder, resourceType } = signatureRes.data;

    // 2. Build the multipart form data payload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    // 3. Post the form data directly to Cloudinary
    // Use the resource_type from the backend (image, video, raw, auto)
    const resolvedType = resourceType ?? 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resolvedType}/upload`;

    try {
        const res = await axios.post(cloudinaryUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000, // 30-second timeout
        });

        // Cloudinary returns the secure URL in 'secure_url'
        return res.data.secure_url;
    } catch (err: unknown) {
        // Surface Cloudinary's error message for easier debugging
        const cloudErr = (err as any)?.response?.data?.error?.message;
        throw new Error(cloudErr ?? 'Error al subir la imagen a Cloudinary');
    }
};

