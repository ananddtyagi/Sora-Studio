import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // List all videos using OpenAI's list endpoint
    const videos = await openai.videos.list();

    return NextResponse.json({
      videos: videos.data || [],
    });
  } catch (error: any) {
    console.error('Video list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list videos' },
      { status: 500 }
    );
  }
}
