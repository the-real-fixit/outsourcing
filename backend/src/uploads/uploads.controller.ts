import { Controller, Get, UseGuards, InternalServerErrorException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary synchronously (since environment variables should be available at startup)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Controller('upload')
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);

    @UseGuards(AuthGuard('jwt'))
    @Get('signature')
    getUploadSignature() {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            this.logger.error(
                'Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET must all be set.'
            );
            throw new InternalServerErrorException(
                'Cloudinary no está configurado en el servidor. Contacta al administrador.'
            );
        }

        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const folder = 'fixit_uploads';
            const resourceType = 'image';

            // Generate signature — must include all params sent to Cloudinary
            const signature = cloudinary.utils.api_sign_request(
                { timestamp, folder },
                apiSecret
            );

            return {
                signature,
                timestamp,
                apiKey,
                cloudName,
                folder,
                resourceType,
            };
        } catch (err) {
            this.logger.error('Error generating Cloudinary signature', err);
            throw new InternalServerErrorException('No se pudo generar la firma de subida.');
        }
    }
}

