'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceLang } from './settings'

/**
 * Pick the best available TTS voice for a given language code.
 *
 * Priority order (highest → lowest):
 *   1. Google built-in voice, exact lang  — Chrome's own voices always work in Chrome
 *   2. Classic system voice, exact lang   — e.g. "Meijia | zh-TW" (if actually installed)
 *   3. Classic system voice, prefix lang
 *   4. Personality-variant voice, exact lang  — e.g. "Eddy (Chinese (Taiwan))"
 *   5. Personality-variant voice, prefix lang
 *
 * Why prefer Google voices?
 *   Chrome on macOS sometimes silently ignores utterance.voice when set to a
 *   system (macOS) voice — falling back to the OS default (often zh-HK).
 *   Chrome's own Google voices (Google 國語（臺灣）, Google 普通话, etc.) are
 *   handled internally by Chrome and are always honoured.
 *
 * Strict boundary rule:
 *   Never cross zh-HK (Cantonese) ↔ zh-TW/zh-CN (Mandarin) boundaries.
 */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: VoiceLang,
): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined

  const norm = (s: string) => s.replace(/_/g, '-').toLowerCase()
  const target = norm(lang)

  const isGoogle      = (v: SpeechSynthesisVoice) => v.name.startsWith('Google')
  const isPersonality = (v: SpeechSynthesisVoice) => /\(.*\)/.test(v.name)

  // 1. Google voice, exact lang
  const g = voices.find(v => isGoogle(v) && norm(v.lang) === target)
  if (g) return g

  // 2. Classic (non-personality) system voice, exact lang
  const ce = voices.find(v => !isPersonality(v) && !isGoogle(v) && norm(v.lang) === target)
  if (ce) return ce

  // 3. Classic system voice, prefix lang
  const cp = voices.find(v => !isPersonality(v) && !isGoogle(v) && norm(v.lang).startsWith(target))
  if (cp) return cp

  // 4. Personality voice, exact lang (may lack downloaded voice data)
  const pe = voices.find(v => norm(v.lang) === target)
  if (pe) return pe

  // 5. Personality voice, prefix lang
  const pp = voices.find(v => norm(v.lang).startsWith(target))
  if (pp) return pp

  // No cross-dialect fallback
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

      // Always try to pull a fresh voice list in case voiceschanged fired late.
      const voices =
        voicesRef.current.length > 0
          ? voicesRef.current
          : window.speechSynthesis.getVoices()

      const voice = pickVoice(voices, lang)

      console.log('[useVoice] speak', { lang, voices: voices.length, picked: voice?.name ?? 'none', pickedLang: voice?.lang ?? 'none' })

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang   // baseline — required even when voice is set explicitly
      utterance.rate = 0.88
      utterance.pitch = 1.05
      if (voice) utterance.voice = voice   // explicit > lang-hint

      // macOS Chrome bug: calling cancel() and immediately speak() causes the
      // browser to ignore utterance.voice and fall back to the system default.
      // Wrapping speak() in a short setTimeout lets cancel() fully flush first.
      window.speechSynthesis.cancel()
      setTimeout(() => window.speechSynthesis.speak(utterance), 150)
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
