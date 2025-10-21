import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseOpenAIError, getStatusFromErrorCode } from '@/lib/errors';

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

    // If video failed, include structured error information
    let errorInfo = null;
    if (video.status === 'failed' && video.error) {
      errorInfo = typeof video.error === 'string'
        ? { code: 'generation_failed', message: video.error }
        : video.error;
    }

    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress || 0,
      error: errorInfo,
    });
  } catch (error: any) {
    console.error('Video status error:', error);
    const errorResponse = parseOpenAIError(error);
    const statusCode = getStatusFromErrorCode(errorResponse.error.code);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
