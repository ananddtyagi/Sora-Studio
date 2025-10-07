import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: 'gpt-5',
      instructions:
        'Create a concise, cinematic video title (max 8 words) based on the provided description. Respond with the title only and do not include quotation marks or additional commentary.',
      input: description,
    });

    const title = response.output_text?.trim();
    const safeTitle = title ? title.replace(/^["']|["']$/g, '') : 'Untitled Video';

    return NextResponse.json({ title: safeTitle });
  } catch (error: any) {
    console.error('Video title generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate title' },
      { status: 500 }
    );
  }
}
