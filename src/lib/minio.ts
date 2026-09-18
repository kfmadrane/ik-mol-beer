import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});

const BUCKET_NAME = 'radiant-turing';

let isInitialized = false;

// Ensure bucket exists and is public
export async function initializeMinio() {
  if (isInitialized) return;
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'eu-west-1');
      
      // Make bucket public so images/audio can be read directly
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`Bucket ${BUCKET_NAME} created and made public.`);
    }
    isInitialized = true;
  } catch (error) {
    console.error('MinIO initialization failed:', error);
  }
}

export async function uploadFile(file: File, prefix: string): Promise<string> {
  await initializeMinio();
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'webm';
  const filename = `${prefix}_${Date.now()}.${ext}`;
  
  await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
    'Content-Type': file.type || 'application/octet-stream',
  });
  
  // Return the proxy URL instead of direct MinIO URL so it works on any device
  return `/api/media/${filename}`;
}

export async function deleteFile(fileUrl: string) {
  try {
    // Extract filename from URL
    const urlParts = fileUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    await minioClient.removeObject(BUCKET_NAME, filename);
  } catch (error) {
    console.error('Failed to delete file from MinIO:', error);
  }
}
