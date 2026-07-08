import axios from 'axios';
import api from '../services/api';

/** Allowed image MIME types */
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'image/tiff',
    'image/avif',
    'image/heic',
    'image/heif',
];

/** Max file size: 10 MB */
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validates that a file is an allowed image type and within size limits.
 * Throws an Error with a descriptive message if invalid.
 */
export const validateImageFile = (file: File): void => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error(
            `"${file.name}" no es un tipo de imagen válido. ` +
            `Formatos aceptados: JPG, PNG, GIF, WEBP, BMP, SVG, TIFF, AVIF, HEIC.`
        );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        throw new Error(
            `"${file.name}" es demasiado grande (${sizeMB} MB). ` +
            `El tamaño máximo permitido es ${MAX_FILE_SIZE_MB} MB.`
        );
    }
};

/**
 * Uploads a file directly to Cloudinary using a secure signed request from the backend.
 * Validates the file type and size before uploading.
 * @param file The image file to upload.
 * @returns The secure URL of the uploaded asset.
 */
export const uploadFileToCloudinary = async (file: File): Promise<string> => {
    // 0. Validate file before hitting any API
    validateImageFile(file);

    // 1. Request signature and credentials from NestJS backend
    let signatureRes;
    try {
        signatureRes = await api.get('/upload/signature');
    } catch (err: unknown) {
        const status = (err as any)?.response?.status;
        const msg = (err as any)?.response?.data?.message;
        if (status === 401) {
            throw new Error('Tu sesión expiró. Por favor inicia sesión de nuevo.');
        }
        throw new Error(msg ?? 'No se pudo obtener la firma de subida del servidor.');
    }

    const { signature, timestamp, apiKey, cloudName, folder, resourceType } = signatureRes.data;

    // 2. Build the multipart form data payload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    // 3. Post the form data directly to Cloudinary
    const resolvedType = resourceType ?? 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resolvedType}/upload`;

    try {
        const res = await axios.post(cloudinaryUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000, // 60-second timeout for large images
        });
        return res.data.secure_url;
    } catch (err: unknown) {
        const cloudErr = (err as any)?.response?.data?.error?.message;
        throw new Error(cloudErr ?? `Error al subir "${file.name}" a Cloudinary.`);
    }
};

