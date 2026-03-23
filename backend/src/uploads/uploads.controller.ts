import { Controller, Post, UseInterceptors, UploadedFiles, UseGuards, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary synchronously (since environment variables should be available at startup)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'fixit_uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'heic', 'pdf', 'doc', 'docx'],
    };
  },
});

@Controller('upload')
export class UploadsController {
    @UseGuards(AuthGuard('jwt'))
    @Post()
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage: storage,
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp|heic|pdf|doc|docx)$/i)) {
                return callback(new BadRequestException('Invalid file format!'), false);
            }
            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024 // 5 MB ceiling per file for DoS protection
        }
    }))
    uploadMultipleFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files uploaded or invalid file format');
        }
        
        // Cloudinary provides the secure URL in the 'path' property
        const urls = files.map(file => file.path);
        
        return { urls };
    }
}
