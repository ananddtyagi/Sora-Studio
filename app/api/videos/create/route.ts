import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, inputImageBase64, model = 'sora-2', size = '1280x720', seconds = '8' } = await request.json();
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

    // Convert base64 to buffer if input image is provided
    let inputReference;
    if (inputImageBase64) {
      const buffer = Buffer.from(inputImageBase64, 'base64');
      const blob = new Blob([buffer], { type: 'image/png' });
      const file = new File([blob], 'input.png', { type: 'image/png' });
      inputReference = file;
    }

    const videoParams: any = {
      model,
      prompt,
      size,
      seconds,
    };

    if (inputReference) {
      videoParams.input_reference = inputReference;
    }

    const video = await openai.videos.create(videoParams);

    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress || 0,
    });
  } catch (error: any) {
    console.error('Video creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create video' },
      { status: 500 }
    );
  }
}
