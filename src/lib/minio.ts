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

import { spawn } from 'child_process';

export function convertToMp3(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-f', 'mp3',
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      'pipe:1',
    ]);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    ffmpeg.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => stderrChunks.push(chunk));

    ffmpeg.stdin.on('error', () => {});

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
      } else {
        const stderrMsg = Buffer.concat(stderrChunks).toString();
        reject(new Error(`ffmpeg exited with code ${code}: ${stderrMsg}`));
      }
    });

    ffmpeg.on('error', reject);
    ffmpeg.stdin.end(inputBuffer);
  });
}

export async function uploadFile(file: File, prefix: string): Promise<string> {
  await initializeMinio();
  
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  let mimeType = file.type || 'application/octet-stream';

  const isAudio =
    file.type.startsWith('audio/') ||
    ['webm', 'mp4', 'm4a', 'wav', 'ogg', 'aac', 'mp3'].includes(ext) ||
    prefix.includes('_aud_') ||
    prefix.startsWith('letter_');

  if (isAudio) {
    try {
      buffer = await convertToMp3(buffer);
      ext = 'mp3';
      mimeType = 'audio/mpeg';
    } catch (err) {
      console.error('FFmpeg transcoding to MP3 failed during upload:', err);
    }
  }

  const filename = `${prefix}_${Date.now()}.${ext}`;
  
  await minioClient.putObject(BUCKET_NAME, filename, buffer, buffer.length, {
    'Content-Type': mimeType,
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
