'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceLang } from './settings'

/**
 * Pick the best available TTS voice for a given language code.
 * Strict: never let zh-TW/zh-CN fall back to zh-HK (Cantonese), and vice versa.
 */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: VoiceLang,
): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined

  // 1. Exact lang match  (e.g. "zh-HK" === "zh-HK")
  const exact = voices.find(v => v.lang === lang)
  if (exact) return exact

  // 2. Prefix match      (e.g. "zh-HK-Sinji" starts with "zh-HK")
  const prefix = voices.find(v => v.lang.startsWith(lang))
  if (prefix) return prefix

  // 3. No acceptable fallback — return undefined so we still set utterance.lang
  //    and let the browser try. Do NOT cross zh-HK ↔ zh-TW/CN boundaries.
  return undefined
}

export function useVoice(lang: VoiceLang = 'zh-TW') {
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)

  // Keep voices in a ref (updated by voiceschanged) so speak() always uses the
  // latest list without needing it as a dependency.
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
      utterance.lang = lang        // always set as baseline
      utterance.rate = 0.88
      utterance.pitch = 1.05

      const voice = pickVoice(voicesRef.current, lang)
      if (voice) utterance.voice = voice  // explicit voice overrides browser default

      window.speechSynthesis.speak(utterance)
    },
    [lang], // recreated whenever lang changes
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
