'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { VoiceLang } from './settings'

/**
 * Pick the best available TTS voice for a given language code.
 *
 * Priority order (highest → lowest):
 *   1. Classic named voice, exact lang  (e.g. "Meijia | zh-TW")
 *   2. Classic named voice, prefix lang (e.g. "Meijia | zh-TW-x-…")
 *   3. Personality-variant voice, exact lang  (e.g. "Eddy (Chinese (Taiwan)) | zh-TW")
 *   4. Personality-variant voice, prefix lang
 *
 * Why deprioritise personality voices (Eddy, Flo, Grandma, Reed, Rocko,
 * Sandy, Shelley, Grandpa…)?
 *   macOS lists these voices even when their voice data is NOT downloaded.
 *   Selecting an undownloaded personality voice causes macOS to fall back
 *   silently to whatever the system default is (often zh-HK / Cantonese).
 *   Classic voices (Meijia, Tingting, Sin-Ji…) only appear once actually
 *   installed, so they are reliable.
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

  // Personality voices show "Name (Language (Region))" with ASCII parentheses.
  const isPersonality = (v: SpeechSynthesisVoice) => /\(.*\)/.test(v.name)

  // 1. Classic voice, exact lang
  const classicExact = voices.find(v => !isPersonality(v) && norm(v.lang) === target)
  if (classicExact) return classicExact

  // 2. Classic voice, prefix lang
  const classicPrefix = voices.find(v => !isPersonality(v) && norm(v.lang).startsWith(target))
  if (classicPrefix) return classicPrefix

  // 3. Personality voice, exact lang (fallback — data may or may not be present)
  const personalityExact = voices.find(v => norm(v.lang) === target)
  if (personalityExact) return personalityExact

  // 4. Personality voice, prefix lang
  const personalityPrefix = voices.find(v => norm(v.lang).startsWith(target))
  if (personalityPrefix) return personalityPrefix

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
