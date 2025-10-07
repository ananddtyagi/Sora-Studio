import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;
    const { prompt, model, size, seconds } = await request.json();
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const remixOptions: Record<string, any> = { prompt };

    if (model) remixOptions.model = model;
    if (size) remixOptions.size = size;
    if (seconds) remixOptions.seconds = seconds;

    const video = await openai.videos.remix(videoId, remixOptions);

    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress || 0,
      remixed_from_video_id: video.remixed_from_video_id ?? videoId,
    });
  } catch (error: any) {
    console.error('Video remix error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remix video' },
      { status: 500 }
    );
  }
}
