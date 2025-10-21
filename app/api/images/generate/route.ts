import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseOpenAIError, getStatusFromErrorCode } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { error: 'No image data returned' },
        { status: 500 }
      );
    }

    const imageBase64 = result.data[0]?.b64_json;

    return NextResponse.json({ imageBase64 });
  } catch (error: any) {
    console.error('Image generation error:', error);
    const errorResponse = parseOpenAIError(error);
    const statusCode = getStatusFromErrorCode(errorResponse.error.code);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
