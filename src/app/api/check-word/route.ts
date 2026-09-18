import { NextResponse } from 'next/server';
import nspell from 'nspell';
import dictNl from 'dictionary-nl';

let spellChecker: any = null;

function getSpellChecker() {
  if (spellChecker) return spellChecker;
  spellChecker = nspell(dictNl as any);
  return spellChecker;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'Word is required' }, { status: 400 });
  }

  try {
    const checker = getSpellChecker();
    // Validate the word
    const isCorrect = checker.correct(word);
    
    return NextResponse.json({ word, exists: isCorrect });
  } catch (error) {
    console.error('Dictionary error:', error);
    return NextResponse.json({ error: 'Failed to check word' }, { status: 500 });
  }
}
