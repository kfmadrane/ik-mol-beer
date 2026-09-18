const { PrismaClient } = require('@prisma/client');
const Minio = require('minio');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});

const BUCKET_NAME = 'radiant-turing';

function convertToMp3(inputBuffer) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',
      '-f', 'mp3',
      '-acodec', 'libmp3lame',
      '-ab', '128k',
      'pipe:1',
    ]);

    const stdoutChunks = [];
    const stderrChunks = [];

    ffmpeg.stdout.on('data', (chunk) => stdoutChunks.push(chunk));
    ffmpeg.stderr.on('data', (chunk) => stderrChunks.push(chunk));

    ffmpeg.stdin.on('error', () => {});

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
      } else {
        const errMsg = Buffer.concat(stderrChunks).toString();
        reject(new Error(`ffmpeg exited with code ${code}: ${errMsg}`));
      }
    });

    ffmpeg.on('error', reject);
    ffmpeg.stdin.end(inputBuffer);
  });
}

async function migrate() {
  console.log('Starting migration of .webm audio files to .mp3...');

  // 1. Migrate Words
  const words = await prisma.word.findMany();
  for (const word of words) {
    if (word.audioPath && word.audioPath.endsWith('.webm')) {
      const oldFilename = word.audioPath.split('/').pop();
      const newFilename = oldFilename.replace(/\.webm$/, '.mp3');
      const newAudioPath = `/api/media/${newFilename}`;

      console.log(`Migrating word "${word.text}": ${oldFilename} -> ${newFilename}`);

      try {
        const stream = await minioClient.getObject(BUCKET_NAME, oldFilename);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const webmBuffer = Buffer.concat(chunks);

        const mp3Buffer = await convertToMp3(webmBuffer);
        await minioClient.putObject(BUCKET_NAME, newFilename, mp3Buffer, mp3Buffer.length, {
          'Content-Type': 'audio/mpeg',
        });

        await prisma.word.update({
          where: { id: word.id },
          data: { audioPath: newAudioPath },
        });

        console.log(`Word "${word.text}" updated successfully to ${newAudioPath}`);
      } catch (err) {
        console.error(`Failed to migrate word "${word.text}":`, err.message);
      }
    }
  }

  // 2. Migrate Letters
  const letters = await prisma.letter.findMany();
  for (const letter of letters) {
    if (letter.audioPath && letter.audioPath.endsWith('.webm')) {
      const oldFilename = letter.audioPath.split('/').pop();
      const newFilename = oldFilename.replace(/\.webm$/, '.mp3');
      const newAudioPath = `/api/media/${newFilename}`;

      console.log(`Migrating letter "${letter.symbol}": ${oldFilename} -> ${newFilename}`);

      try {
        const stream = await minioClient.getObject(BUCKET_NAME, oldFilename);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const webmBuffer = Buffer.concat(chunks);

        const mp3Buffer = await convertToMp3(webmBuffer);
        await minioClient.putObject(BUCKET_NAME, newFilename, mp3Buffer, mp3Buffer.length, {
          'Content-Type': 'audio/mpeg',
        });

        await prisma.letter.update({
          where: { id: letter.id },
          data: { audioPath: newAudioPath },
        });

        console.log(`Letter "${letter.symbol}" updated successfully to ${newAudioPath}`);
      } catch (err) {
        console.error(`Failed to migrate letter "${letter.symbol}":`, err.message);
      }
    }
  }

  console.log('Migration complete!');
  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
