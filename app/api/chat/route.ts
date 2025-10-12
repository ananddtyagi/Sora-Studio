import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { messages, remixContext } = await request.json();
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Convert chat messages to Responses API format
    const input = messages.map((msg: any) => {
      const formattedMsg: any = {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      };

      // If the message has an image, format it for Responses API vision
      if (msg.imageUrl) {
        formattedMsg.content = [
          { type: 'input_text', text: msg.content || 'What do you see in this image?' },
          { type: 'input_image', image_url: msg.imageUrl }
        ];
      }

      return formattedMsg;
    });

    // Build instructions with remix context if provided
    let instructions = 'You\'re a casual, friendly creative partner helping someone make a video. Keep responses SHORT (1-3 sentences max). Be conversational and natural - like texting a friend. Ask simple questions to understand what they want - focus on content, style, mood, and story. Don\'t ask about video duration or resolution (those are in the config panel). Don\'t be formal or overly enthusiastic. Just vibe with their ideas and help them explore what they\'re going for. Never mention technical features unless they ask. When analyzing images, describe what you see and how it could be used in a video. IMPORTANT: If the user indicates they\'re happy with the idea and ready to generate the video (e.g., "let\'s do it", "I\'m ready", "let\'s make it", "sounds good"), respond with ONLY this JSON: {"readyToGenerate": true, "message": "Sweet! Hit that Generate Video button and let\'s make it happen 🎬"}';

    if (remixContext) {
      const { videoTitle, previousChat } = remixContext;
      instructions = `You're a casual, friendly creative partner helping someone REMIX an existing video. Keep responses SHORT (1-3 sentences max). Be conversational and natural - like texting a friend.

REMIX CONTEXT:
- Original Video Title: "${videoTitle}"
${previousChat ? `- Original Conversation:\n${previousChat}` : ''}

The user wants to modify/remix this video. Help them describe what changes they want to make - focus on what should be different, what should stay the same, content modifications, style changes, mood adjustments, or story alterations. Don't ask about video duration or resolution (those are in the config panel). Just vibe with their remix ideas and help them articulate the changes they want.

IMPORTANT: If the user indicates they're happy with the remix idea and ready to generate (e.g., "let's do it", "I'm ready", "let's make it", "sounds good"), respond with ONLY this JSON: {"readyToGenerate": true, "message": "Sweet! Hit that Generate Video button and let's remix it 🎬"}`;
    }

    const response = await openai.responses.create({
      model: 'gpt-5',
      reasoning: { effort: 'low' },
      instructions,
      input,
    });

    const assistantMessage = response.output_text || 'I apologize, but I could not generate a response.';

    // Check if the response is the ready signal
    let readyToGenerate = false;
    let finalMessage = assistantMessage;

    try {
      const parsed = JSON.parse(assistantMessage);
      if (parsed.readyToGenerate === true) {
        readyToGenerate = true;
        finalMessage = parsed.message || assistantMessage;
      }
    } catch (e) {
      // Not JSON, just use the message as-is
    }

    return NextResponse.json({ message: finalMessage, readyToGenerate });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
