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

// Mirrors the pickVoice() logic in useVoice.ts — must stay in sync.
function pickVoice(voices: SpeechSynthesisVoice[], lang: VoiceLang) {
  if (voices.length === 0) return undefined
  const norm = (s: string) => s.replace(/_/g, '-').toLowerCase()
  const target = norm(lang)
  return (
    voices.find(v => norm(v.lang) === target) ??
    voices.find(v => norm(v.lang).startsWith(target))
  )
}

// Play using the same voice selection strategy as the game itself.
function testVoice(lang: VoiceLang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const voices = window.speechSynthesis.getVoices()
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(TEST_PHRASES[lang])
  u.lang = lang
  u.rate = 0.88
  const voice = pickVoice(voices, lang)
  if (voice) u.voice = voice
  window.speechSynthesis.speak(u)
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
            <button
              onClick={opt.onTest}
              title="試聽"
              className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 text-base transition-all active:scale-90"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
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

// ─── Voice diagnostic ─────────────────────────────────────────────────────────
// Shows which system voice will actually be used for each language option.

const LANG_ROWS: { lang: VoiceLang; label: string }[] = [
  { lang: 'zh-TW', label: '國語（台灣）' },
  { lang: 'zh-CN', label: '普通話（中國）' },
  { lang: 'zh-HK', label: '粵語（香港）' },
]

function VoiceDiagnostic() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [ready, setReady] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v)
      setReady(true)
      // Log everything so we can debug in DevTools
      console.log('[VoiceDiagnostic] All voices:', v.map(x => `${x.name} | ${x.lang}`))
      console.log('[VoiceDiagnostic] zh-* voices:', v.filter(x => x.lang.toLowerCase().startsWith('zh')).map(x => `${x.name} | ${x.lang}`))
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  if (!ready) return null

  // ALL voices whose lang starts with "zh" (any casing / separator)
  const zhVoices = voices.filter(v => v.lang.toLowerCase().startsWith('zh'))

  return (
    <div className="flex flex-col gap-2">
      {/* Per-language match result */}
      {LANG_ROWS.map(({ lang, label }) => {
        const matched = pickVoice(voices, lang)
        return (
          <div
            key={lang}
            className="rounded-xl px-4 py-3 border flex items-center justify-between gap-3"
            style={{
              background: 'var(--bg-card)',
              borderColor: matched ? 'var(--color-border)' : 'rgba(230,57,70,0.3)',
            }}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
                {matched ? `${matched.name} (${matched.lang})` : '未找到匹配聲音'}
              </p>
            </div>
            {matched ? (
              <button
                onClick={() => testVoice(lang)}
                className="flex-shrink-0 text-xs px-3 py-1 rounded-lg border transition-all active:scale-90"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                🔊
              </button>
            ) : (
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(230,57,70,0.1)', color: 'var(--color-nipper)' }}>
                ✗ 未匹配
              </span>
            )}
          </div>
        )
      })}

      {/* Raw voice dump — helps diagnose unexpected lang codes */}
      <button
        onClick={() => setShowRaw(v => !v)}
        className="text-xs text-left mt-1"
        style={{ color: 'var(--color-primary)' }}
      >
        {showRaw ? '▲ 收起' : '▼ 顯示系統偵測到的所有中文聲音'}
      </button>
      {showRaw && (
        <div className="rounded-xl px-4 py-3 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
          {zhVoices.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-nipper)' }}>未偵測到任何中文聲音</p>
          ) : (
            zhVoices.map(v => (
              <div key={v.name} className="flex items-center justify-between py-1 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {v.name} <span className="font-mono" style={{ color: 'var(--color-text)' }}>({v.lang})</span>
                </span>
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel()
                    const u = new SpeechSynthesisUtterance('測試')
                    u.voice = v
                    u.lang = v.lang
                    window.speechSynthesis.speak(u)
                  }}
                  className="text-xs px-2 py-0.5 rounded border ml-2 flex-shrink-0"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                >🔊</button>
              </div>
            ))
          )}
        </div>
      )}
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
    { value: 'zh-TW', label: t(lang, 'voiceZhTW'), onTest: () => testVoice('zh-TW') },
    { value: 'zh-CN', label: t(lang, 'voiceZhCN'), onTest: () => testVoice('zh-CN') },
    { value: 'zh-HK', label: t(lang, 'voiceZhHK'), onTest: () => testVoice('zh-HK') },
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

        {/* 語音診斷：顯示每個語言實際對應的系統聲音 */}
        <SectionLabel label="語音診斷" />
        <VoiceDiagnostic />

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
