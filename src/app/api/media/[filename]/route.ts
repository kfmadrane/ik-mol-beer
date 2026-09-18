import { NextResponse } from 'next/server';
import * as Minio from 'minio';
import { spawn } from 'child_process';

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});

const BUCKET_NAME = 'radiant-turing';

// Cache for transcoded MP3s so transcoding only happens once per file
const mp3Cache = new Map<string, Buffer>();

function transcodeToMp3(inputBuffer: Buffer): Promise<Buffer> {
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

    ffmpeg.stdin.on('error', () => {
      // Avoid unhandled EPIPE when ffmpeg terminates early
    });

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;

    // Get the object stream from MinIO
    const dataStream = await minioClient.getObject(BUCKET_NAME, filename);

    const chunks: any[] = [];
    for await (const chunk of dataStream) {
      chunks.push(chunk);
    }
    let buffer: any = Buffer.concat(chunks);

    // Determine content type based on extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    else if (ext === 'mp3') contentType = 'audio/mpeg';
    else if (ext === 'mp4' || ext === 'm4a') contentType = 'audio/mp4';
    else if (ext === 'aac') contentType = 'audio/aac';
    else if (ext === 'wav') contentType = 'audio/wav';
    else if (ext === 'webm') {
      // Transcode WebM to MP3 for universal playback (WebKit / iOS / iPadOS Safari does not support WebM audio)
      if (mp3Cache.has(filename)) {
        buffer = mp3Cache.get(filename)!;
        contentType = 'audio/mpeg';
      } else {
        try {
          const mp3Buffer = await transcodeToMp3(buffer);
          mp3Cache.set(filename, mp3Buffer);
          buffer = mp3Buffer;
          contentType = 'audio/mpeg';
        } catch (transcodeErr) {
          console.error('FFmpeg transcoding failed, serving original:', transcodeErr);
          contentType = 'audio/webm';
        }
      }
    }

    const totalLength = buffer.length;
    const rangeHeader = request.headers.get('range');

    // Handle HTTP 206 Partial Content (mandatory for iOS/iPadOS Safari audio playback)
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        let start = match[1] ? parseInt(match[1], 10) : 0;
        let end = match[2] ? parseInt(match[2], 10) : totalLength - 1;

        if (isNaN(start)) start = 0;
        if (isNaN(end) || end >= totalLength) end = totalLength - 1;

        if (start > end) {
          return new NextResponse('Requested range not satisfiable', {
            status: 416,
            headers: {
              'Content-Range': `bytes */${totalLength}`,
            },
          });
        }

        const slice = buffer.subarray(start, end + 1);

        return new NextResponse(slice, {
          status: 206,
          headers: {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${totalLength}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': slice.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Length': totalLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to proxy media:', error);
    return new NextResponse('Not found', { status: 404 });
  }
}
