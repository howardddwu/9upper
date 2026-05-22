'use client'

import { useCallback, useRef, useState } from 'react'
import { VoiceLang } from './settings'

export function useVoice(lang: VoiceLang = 'zh-TW') {
  const [isMuted, setIsMuted] = useState(false)
  const isMutedRef = useRef(false)

  const speak = useCallback((text: string) => {
    if (isMutedRef.current) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.88
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }, [lang])

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
