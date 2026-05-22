'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceLang } from './settings'

/**
 * Pick the best available TTS voice for a given language code.
 *
 * Why explicit voice selection matters:
 *   Setting utterance.lang alone is unreliable on macOS Chrome —
 *   the browser may ignore it and use the last-used voice (often zh-HK).
 *   We MUST explicitly set utterance.voice when a match is found.
 *
 * Why we normalise lang codes:
 *   macOS reports some voices with underscores: "zh_TW", "zh_CN", "zh_HK"
 *   instead of the BCP-47 hyphen form. We normalise both sides before matching.
 *
 * Strict boundary rule:
 *   Never cross zh-HK (Cantonese) ↔ zh-TW/zh-CN (Mandarin) even as a fallback.
 */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: VoiceLang,
): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined

  const norm = (s: string) => s.replace(/_/g, '-').toLowerCase()
  const target = norm(lang) // e.g. "zh-tw"

  // 1. Exact match after normalisation
  const exact = voices.find(v => norm(v.lang) === target)
  if (exact) return exact

  // 2. Prefix match (e.g. "zh-tw-mei-jia" starts with "zh-tw")
  const prefix = voices.find(v => norm(v.lang).startsWith(target))
  if (prefix) return prefix

  // 3. No cross-dialect fallback
  return undefined
}

export function useVoice(lang: VoiceLang = 'zh-TW') {
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)

  // Kept in a ref so speak() always sees the latest list without re-creating.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (isMutedRef.current) return
      if (typeof window === 'undefined' || !window.speechSynthesis) return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang   // baseline — required even when voice is set explicitly
      utterance.rate = 0.88
      utterance.pitch = 1.05

      // Always try to pull a fresh voice list in case voiceschanged fired late.
      const voices =
        voicesRef.current.length > 0
          ? voicesRef.current
          : window.speechSynthesis.getVoices()

      const voice = pickVoice(voices, lang)
      if (voice) utterance.voice = voice   // explicit > lang-hint

      window.speechSynthesis.speak(utterance)
    },
    [lang],
  )

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      isMutedRef.current = next
      if (next) window.speechSynthesis?.cancel()
      return next
    })
  }, [])

  return { speak, stop, isMuted, toggleMute }
}
