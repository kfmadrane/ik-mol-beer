import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/minio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const words = await prisma.word.findMany({
      orderBy: { text: 'asc' },
    });
    return NextResponse.json(words);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const image = formData.get('image') as File | null;
    const audio = formData.get('audio') as File | null;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let imagePath = null;
    if (image) {
      imagePath = await uploadFile(image, `word_img_${text}`);
    }

    let audioPath = null;
    if (audio) {
      audioPath = await uploadFile(audio, `word_aud_${text}`);
    }

    const word = await prisma.word.create({
      data: {
        text,
        imagePath,
        audioPath,
      },
    });

    return NextResponse.json(word);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Word already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create word' }, { status: 500 });
  }
}
