'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSettings } from '@/lib/useSettings'
import { UILang, VoiceLang, GameMode } from '@/lib/settings'
import { t } from '@/lib/i18n'

// ─── Voice helpers ────────────────────────────────────────────────────────────

const TEST_PHRASES: Record<VoiceLang, string> = {
  'zh-TW': '你好，這是台灣國語測試。',
  'zh-CN': '你好，这是普通话测试。',
  'zh-HK': '你好，呢個係粵語測試。',
}

// Play a cloud-TTS test clip; falls back to system speech if API unavailable
async function testVoiceCloud(lang: VoiceLang) {
  const text = TEST_PHRASES[lang]
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    })
    if (!res.ok) throw new Error('api error')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
  } catch {
    // Fallback: system TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = 0.88
      window.speechSynthesis.speak(u)
    }
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type OptionItem<T> = {
  value: T; label: string; sub?: string; disabled?: boolean; onTest?: () => void
}

function OptionGroup<T extends string>({
  options, value, onChange,
}: { options: OptionItem<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <div key={opt.value} className="flex items-center gap-2">
          <button
            onClick={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            className="flex-1 flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-left"
            style={{
              background: value === opt.value ? 'rgba(244,162,97,0.12)' : 'var(--bg-card)',
              borderColor: value === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
              opacity: opt.disabled ? 0.45 : 1,
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <div>
              <span className="font-semibold text-sm" style={{ color: value === opt.value ? 'var(--color-primary)' : 'var(--color-text)' }}>
                {opt.label}
              </span>
              {opt.sub && <span className="text-xs ml-2" style={{ color: 'var(--color-muted)' }}>{opt.sub}</span>}
            </div>
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: value === opt.value ? 'var(--color-primary)' : 'var(--color-muted)' }}>
              {value === opt.value && <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary)' }} />}
            </div>
          </button>
          {opt.onTest && !opt.disabled && (
            <button onClick={opt.onTest} title="試聽" className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 text-base transition-all active:scale-90" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              🔊
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-bold tracking-widest uppercase mb-2 mt-5" style={{ color: 'var(--color-primary)' }}>
      {label}
    </p>
  )
}

// ─── Voice status panel ───────────────────────────────────────────────────────
// Shows whether cloud TTS is available (and optionally which system voices exist)

function VoiceStatus() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'fallback'>('checking')

  useEffect(() => {
    // Quick ping to check if the TTS API is configured
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '測試', lang: 'zh-TW' }),
    })
      .then(r => setStatus(r.ok ? 'ok' : 'fallback'))
      .catch(() => setStatus('fallback'))
  }, [])

  if (status === 'checking') return null

  if (status === 'ok') {
    return (
      <div className="rounded-xl px-4 py-3 border flex items-center gap-3" style={{ background: 'rgba(46,204,113,0.07)', borderColor: 'rgba(46,204,113,0.3)' }}>
        <span className="text-xl">✅</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-realupper)' }}>雲端語音已啟用</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>語音由雲端生成，無需安裝系統聲音，所有用戶皆可正常使用。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl px-4 py-3 border flex items-center gap-3" style={{ background: 'rgba(244,162,97,0.08)', borderColor: 'rgba(244,162,97,0.4)' }}>
      <span className="text-xl">⚠️</span>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>使用系統語音（備援）</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>雲端語音 API 未設定。語音品質取決於系統安裝的聲音。</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, update, loaded } = useSettings()
  const lang = settings.uiLang

  if (!loaded) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="dot-loader flex gap-2"><span /><span /><span /></div>
      </div>
    )
  }

  const modeOptions: OptionItem<GameMode>[] = [
    { value: 'self',   label: t(lang, 'modeSelf'),   sub: t(lang, 'modeSelfDesc') },
    { value: 'online', label: t(lang, 'modeOnline'), sub: t(lang, 'comingSoon'), disabled: true },
  ]

  const uiLangOptions: OptionItem<UILang>[] = [
    { value: 'zh-TW', label: t(lang, 'langZhTW') },
    { value: 'zh-CN', label: t(lang, 'langZhCN') },
  ]

  const voiceLangOptions: OptionItem<VoiceLang>[] = [
    { value: 'zh-TW', label: t(lang, 'voiceZhTW'), onTest: () => testVoiceCloud('zh-TW') },
    { value: 'zh-CN', label: t(lang, 'voiceZhCN'), onTest: () => testVoiceCloud('zh-CN') },
    { value: 'zh-HK', label: t(lang, 'voiceZhHK'), onTest: () => testVoiceCloud('zh-HK') },
  ]

  return (
    <div className="min-h-svh flex flex-col items-center px-4 py-8" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col">

        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="w-9 h-9 rounded-full flex items-center justify-center border text-sm transition-all" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>←</Link>
          <h1 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>{t(lang, 'settingsTitle')}</h1>
        </div>

        <SectionLabel label={t(lang, 'modeLabel')} />
        <OptionGroup options={modeOptions} value={settings.mode} onChange={v => update({ mode: v })} />

        <SectionLabel label={t(lang, 'langLabel')} />
        <OptionGroup options={uiLangOptions} value={settings.uiLang} onChange={v => update({ uiLang: v as UILang })} />

        <SectionLabel label={t(lang, 'voiceLabel')} />
        <OptionGroup options={voiceLangOptions} value={settings.voiceLang} onChange={v => update({ voiceLang: v as VoiceLang })} />

        {/* 語音狀態 */}
        <div className="mt-3">
          <VoiceStatus />
        </div>

        <SectionLabel label={t(lang, 'advancedLabel')} />
        <div className="rounded-xl px-4 py-4 border text-sm text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
          {t(lang, 'advancedNote')} 🚧
        </div>

        <p className="text-xs text-center mt-8" style={{ color: 'var(--color-muted)' }}>
          瞎掰王 v0.1 · 9UPPER
        </p>
      </div>
    </div>
  )
}
