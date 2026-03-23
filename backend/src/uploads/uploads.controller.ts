import { Controller, Post, UseInterceptors, UploadedFiles, UseGuards, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Controller('upload')
export class UploadsController {
    @UseGuards(AuthGuard('jwt'))
    @Post()
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = uuidv4() + extname(file.originalname);
                callback(null, uniqueSuffix);
            }
        }),
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
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const urls = files.map(file => `${baseUrl}/uploads/${file.filename}`);
        return { urls };
    }
}
