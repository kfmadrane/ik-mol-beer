import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFile, uploadFile } from '@/lib/minio';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const image = formData.get('image') as File | null;
    const audio = formData.get('audio') as File | null;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const existingWord = await prisma.word.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingWord) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    let imagePath = existingWord.imagePath;
    if (image) {
      if (existingWord.imagePath) await deleteFile(existingWord.imagePath);
      imagePath = await uploadFile(image, `word_img_${text}`);
    }

    let audioPath = existingWord.audioPath;
    if (audio) {
      if (existingWord.audioPath) await deleteFile(existingWord.audioPath);
      audioPath = await uploadFile(audio, `word_aud_${text}`);
    }

    const word = await prisma.word.update({
      where: { id: resolvedParams.id },
      data: { text, imagePath, audioPath },
    });

    return NextResponse.json(word);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Word already exists' }, { status: 400 });
    }
    console.error('Failed to update word:', error);
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const word = await prisma.word.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    if (word.imagePath) {
      await deleteFile(word.imagePath);
    }

    if (word.audioPath) {
      await deleteFile(word.audioPath);
    }

    await prisma.word.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
}
