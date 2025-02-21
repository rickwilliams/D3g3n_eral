import type { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { elizaLogger } from "@elizaos/core";

/**
 * File Upload System for ElizaOS
 * 
 * This system handles avatar image uploads with the following features:
 * - 3MB file size limit
 * - Image files only
 * - Automatic image processing (512x512 resize)
 * - Base64 encoding for database storage
 * - Extensible storage provider system
 * 
 * Storage can be configured via STORAGE_PROVIDER environment variable:
 * - "local" (default): Stores files in public/uploads
 * - "s3": Can be implemented to use AWS S3 storage
 */

// Configure multer for memory storage (not disk) to allow processing
const upload = multer({
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB limit for avatar images
    },
    fileFilter: (_req, file, cb) => {
        // Accept only images for security
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("Only image files are allowed"));
            return;
        }
        cb(null, true);
    },
}).single("file");

/**
 * Storage Provider Interface
 * Implement this interface to add new storage backends (e.g., S3, Azure, etc.)
 */
interface StorageProvider {
    saveFile(base64Data: string, filename: string): Promise<string>;
}

/**
 * Local File Storage Implementation
 * Stores files in the public/uploads directory
 * Files are processed to 512x512 and saved in the original format
 */
class LocalStorageProvider implements StorageProvider {
    async saveFile(base64Data: string, filename: string): Promise<string> {
        const filePath = path.join(process.cwd(), "public", "uploads", filename);
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Image, "base64");
        
        // Process image to standard size
        await sharp(buffer)
            .resize(512, 512, { fit: "cover" })
            .toFile(filePath);

        return `/uploads/${filename}`;
    }
}

/**
 * S3 Storage Provider Template
 * Can be implemented to use AWS S3 or compatible services
 * Would require additional environment variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_BUCKET_NAME
 * - AWS_REGION
 */
class S3StorageProvider implements StorageProvider {
    async saveFile(base64Data: string, filename: string): Promise<string> {
        // TODO: Implement S3 upload logic
        // 1. Configure AWS SDK with credentials
        // 2. Convert base64 to buffer
        // 3. Upload to S3
        // 4. Return public URL
        throw new Error("S3 storage not implemented");
    }
}

/**
 * Get configured storage provider based on environment
 * Defaults to local storage if not specified
 */
function getStorageProvider(): StorageProvider {
    const storageType = process.env.STORAGE_PROVIDER || "local";
    switch (storageType) {
        case "s3":
            return new S3StorageProvider();
        default:
            return new LocalStorageProvider();
    }
}

/**
 * Main file upload handler
 * Processes incoming files and stores them using the configured provider
 */
export async function handleFileUpload(req: Request, res: Response) {
    try {
        // Handle file upload with multer
        await new Promise((resolve, reject) => {
            upload(req, res, (err) => {
                if (err) reject(err);
                else resolve(undefined);
            });
        });

        if (!req.file) {
            throw new Error("No file uploaded");
        }

        // Process image to standardized format
        const processedImageBuffer = await sharp(req.file.buffer)
            .resize(512, 512, { fit: "cover" })
            .toBuffer();

        // Convert to base64 for storage
        const base64Data = `data:${req.file.mimetype};base64,${processedImageBuffer.toString("base64")}`;

        // Generate unique filename to prevent collisions
        const filename = `${uuidv4()}${path.extname(req.file.originalname)}`;

        // Save using configured storage provider
        const storageProvider = getStorageProvider();
        const url = await storageProvider.saveFile(base64Data, filename);

        res.json({ url });
    } catch (error) {
        elizaLogger.error("File upload error:", error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Upload failed"
        });
    }
} 