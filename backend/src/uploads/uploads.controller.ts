import { Controller, Get, UseGuards } from '@nestjs/common';
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
    @UseGuards(AuthGuard('jwt'))
    @Get('signature')
    getUploadSignature() {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'fixit_uploads';
        const resourceType = 'image';

        // Generate signature — must include all params sent to Cloudinary
        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            process.env.CLOUDINARY_API_SECRET || ''
        );

        return {
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            folder,
            resourceType,
        };
    }
}

