// Backend/src/config/multerConfig.ts

import multer from 'multer'; // No need to import { FileFilterCallback } if you're not using it explicitly
import path from 'path';
import { Request } from 'express';

interface CustomRequest extends Request {
  fileValidationError?: string;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB file size limit
  },
  // Use 'any' type for the callback function to bypass strict type checking
  fileFilter: (req: Request, file, cb: any) => { // <--- Changed 'cb: FileFilterCallback' to 'cb: any'
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      (req as CustomRequest).fileValidationError = 'Only JPEG, PNG, and GIF image files are allowed!';
      // Still pass an Error object, but now TypeScript won't complain about the type of 'Error' vs 'null'
      cb(new Error('Only JPEG, PNG, and GIF image files are allowed!'), false); 
    }
  }
});

export default upload;