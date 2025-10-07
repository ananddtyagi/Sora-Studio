import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const video = await openai.videos.retrieve(id);

    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress || 0,
      error: video.status === 'failed' ? (video.error || 'Video generation failed') : null,
    });
  } catch (error: any) {
    console.error('Video status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get video status' },
      { status: 500 }
    );
  }
}
