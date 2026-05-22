'use client'

import { useCallback, useRef, useState } from 'react'
import { VoiceLang } from './settings'

// ─── Module-level blob cache ──────────────────────────────────────────────────
// Keyed by "lang:text" so the same phrase is only fetched once per session.
const blobCache = new Map<string, Blob>()

async function fetchSpeech(text: string, lang: VoiceLang): Promise<Blob> {
  const key = `${lang}:${text}`
  const hit = blobCache.get(key)
  if (hit) return hit

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  })

  if (!res.ok) throw new Error(`TTS API responded ${res.status}`)

  const blob = await res.blob()
  blobCache.set(key, blob)
  return blob
}

// Fallback: system Web Speech API (used when cloud TTS is unavailable)
function systemSpeak(text: string, lang: VoiceLang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.88
  window.speechSynthesis.speak(u)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoice(lang: VoiceLang = 'zh-TW') {
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)

  // Always points to the currently-playing <audio>, or null
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Incremented on every new speak() call so stale async results are ignored
  const speakIdRef = useRef(0)

  const _stop = useCallback(() => {
    speakIdRef.current++
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(
    async (text: string) => {
      if (isMutedRef.current) return

      // Stop whatever is currently playing
      _stop()

      const id = ++speakIdRef.current

      try {
        const blob = await fetchSpeech(text, lang)

        // If a newer speak() was called while we were fetching, bail out
        if (speakIdRef.current !== id) return

        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
        }

        await audio.play()
      } catch (err) {
        if (speakIdRef.current !== id) return
        // Cloud TTS unavailable — fall back to whatever the browser has
        console.warn('[useVoice] cloud TTS failed, using Web Speech API:', err)
        systemSpeak(text, lang)
      }
    },
    [lang, _stop],
  )

  const stop = _stop

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      isMutedRef.current = next
      if (next) {
        speakIdRef.current++
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
          audioRef.current = null
        }
        window.speechSynthesis?.cancel()
      }
      return next
    })
  }, [])

  return { speak, stop, isMuted, toggleMute }
}
