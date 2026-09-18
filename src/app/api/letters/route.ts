import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/minio';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const letters = await prisma.letter.findMany({
      orderBy: { symbol: 'asc' },
    });
    return NextResponse.json(letters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const symbol = formData.get('symbol') as string;
    const audio = formData.get('audio') as File | null;

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    let audioPath = null;
    if (audio) {
      audioPath = await uploadFile(audio, `letter_${symbol}`);
    }

    const letter = await prisma.letter.create({
      data: {
        symbol,
        audioPath,
      },
    });

    return NextResponse.json(letter);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Letter already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create letter' }, { status: 500 });
  }
}
