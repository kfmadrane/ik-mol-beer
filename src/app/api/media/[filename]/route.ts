import { NextResponse } from 'next/server';
import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});

const BUCKET_NAME = 'radiant-turing';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Get the object stream from MinIO
    const dataStream = await minioClient.getObject(BUCKET_NAME, resolvedParams.filename);
    
    // Determine content type based on extension
    const ext = resolvedParams.filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'webm') contentType = 'audio/webm';
    else if (ext === 'mp3') contentType = 'audio/mpeg';

    // We can cast the Node.js Readable stream to a Web ReadableStream
    // Next.js NextResponse supports Node.js streams via any casting, or we can use a polyfill,
    // but the easiest way is to use the stream directly if supported, or read to buffer.
    // For small audio/images, reading to buffer is fine.
    
    const chunks: any[] = [];
    for await (const chunk of dataStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to proxy media:', error);
    return new NextResponse('Not found', { status: 404 });
  }
}
