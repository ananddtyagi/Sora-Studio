import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseOpenAIError, getStatusFromErrorCode } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
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

    // Remix API only accepts prompt parameter
    const video = await openai.videos.remix(videoId, { prompt });

    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress || 0,
      remixed_from_video_id: video.remixed_from_video_id ?? videoId,
    });
  } catch (error: any) {
    console.error('Video remix error:', error);
    const errorResponse = parseOpenAIError(error);
    const statusCode = getStatusFromErrorCode(errorResponse.error.code);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
