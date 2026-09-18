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
    const symbol = formData.get('symbol') as string;
    const audio = formData.get('audio') as File | null;

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const existingLetter = await prisma.letter.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingLetter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    let audioPath = existingLetter.audioPath;
    if (audio) {
      if (existingLetter.audioPath) await deleteFile(existingLetter.audioPath);
      audioPath = await uploadFile(audio, `letter_${symbol}`);
    }

    const letter = await prisma.letter.update({
      where: { id: resolvedParams.id },
      data: { symbol, audioPath },
    });

    return NextResponse.json(letter);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Letter already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const letter = await prisma.letter.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
    }

    if (letter.audioPath) {
      await deleteFile(letter.audioPath);
    }

    await prisma.letter.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete letter' }, { status: 500 });
  }
}
