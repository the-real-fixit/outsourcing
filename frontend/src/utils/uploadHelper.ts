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
    const { signature, timestamp, apiKey, cloudName, folder } = signatureRes.data;

    // 2. Build the multipart form data payload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    // 3. Post the form data directly to Cloudinary's auto upload endpoint
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const res = await axios.post(cloudinaryUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    // Cloudinary returns the secure URL in 'secure_url'
    return res.data.secure_url;
};
