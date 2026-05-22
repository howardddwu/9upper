import { NextRequest, NextResponse } from 'next/server'
import { VoiceLang } from '@/lib/settings'

// Map each dialect to a distinct OpenAI voice
// All OpenAI voices speak Chinese fluently — choosing different ones
// gives subtle tonal variety across the three language options.
const OPENAI_VOICE: Record<VoiceLang, string> = {
  'zh-TW': 'nova',
  'zh-CN': 'shimmer',
  'zh-HK': 'alloy',
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    // No key configured — let the client fall back to Web Speech API
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 })
  }

  const body = await req.json() as { text?: string; lang?: VoiceLang }
  const { text, lang } = body

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }

  const voice = (lang && OPENAI_VOICE[lang]) ?? 'nova'

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      response_format: 'mp3',
      speed: 0.9,
    }),
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    console.error('[/api/tts] OpenAI error:', upstream.status, err)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 })
  }

  const audio = await upstream.arrayBuffer()

  return new NextResponse(audio, {
    headers: {
      'Content-Type': 'audio/mpeg',
      // Cache for 24 h — same text+lang always produces identical audio
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
