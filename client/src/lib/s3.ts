import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Get environment variables with fallbacks to prevent "missing" errors
const region = import.meta.env.VITE_AWS_REGION;
const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_AWS_BUCKET_NAME;

// Check if required config is available
if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error("Missing AWS configuration:", {
    region: region ? "✓" : "✗",
    accessKeyId: accessKeyId ? "✓" : "✗",
    secretAccessKey: secretAccessKey ? "✓" : "✗", 
    bucketName: bucketName ? "✓" : "✗"
  });
}

const s3Client = new S3Client({
  region: region || "us-east-1", // Fallback to avoid runtime errors
  credentials: {
    accessKeyId: accessKeyId || "missing-key-id",
    secretAccessKey: secretAccessKey || "missing-secret-key",
  },
});

/**
 * Uploads a file to S3 and returns the public URL
 */
export async function uploadToS3(file: File, folderName = 'avatars'): Promise<string> {
  try {
    // Verify AWS configuration before attempting upload
    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error("AWS configuration is incomplete. Check your .env file.");
    }

    // Create a unique file name
    const extension = file.name.split('.').pop();
    const uniqueFileName = `${folderName}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    });
    
    await s3Client.send(command);
    
    // Return the public URL for the file
    return `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueFileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Converts a blob URL to a file and uploads it to S3
 */
export async function convertBlobToS3Url(blobUrl: string): Promise<string> {
  try {
    // Fetch the blob data
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Create a File from the blob
    const file = new File([blob], `avatar-${Date.now()}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
    
    // Upload to S3
    return await uploadToS3(file);
  } catch (error) {
    console.error('Error converting blob to S3 URL:', error);
    throw error;
  }
}
