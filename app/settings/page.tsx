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

function testVoice(lang: VoiceLang, voice?: SpeechSynthesisVoice) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(TEST_PHRASES[lang])
  u.lang = lang
  u.rate = 0.88
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

// ─── Voice diagnostic panel ───────────────────────────────────────────────────

const LANG_GROUPS: { lang: VoiceLang; label: string }[] = [
  { lang: 'zh-TW', label: '國語（台灣）' },
  { lang: 'zh-CN', label: '國語（普通話）' },
  { lang: 'zh-HK', label: '粵語' },
]

function VoiceDiagnostic() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const chineseVoices = voices.filter(v => v.lang.startsWith('zh'))
  const missingMandarin = !voices.some(v => v.lang === 'zh-TW' || v.lang === 'zh-CN' ||
    v.lang.startsWith('zh-TW') || v.lang.startsWith('zh-CN'))

  return (
    <div className="flex flex-col gap-2">
      {/* Voice list by lang group */}
      {LANG_GROUPS.map(({ lang, label }) => {
        const matched = chineseVoices.filter(v => v.lang === lang || v.lang.startsWith(lang))
        return (
          <div key={lang} className="rounded-xl px-4 py-3 border" style={{ background: 'var(--bg-card)', borderColor: matched.length ? 'var(--color-border)' : 'rgba(230,57,70,0.3)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{label}</span>
              {matched.length > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(46,204,113,0.15)', color: 'var(--color-realupper)' }}>
                  ✓ {matched.length} 個聲音
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(230,57,70,0.1)', color: 'var(--color-nipper)' }}>
                  ✗ 未安裝
                </span>
              )}
            </div>
            {matched.length > 0 && (
              <div className="mt-1.5 flex flex-col gap-1">
                {matched.map(v => (
                  <div key={v.name} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{v.name} <span className="opacity-50">({v.lang})</span></span>
                    <button
                      onClick={() => testVoice(lang, v)}
                      className="text-xs px-2 py-0.5 rounded-lg border transition-all active:scale-90"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                    >
                      🔊
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Warning + install guide */}
      {missingMandarin && (
        <div className="rounded-xl p-4 border mt-1" style={{ background: 'rgba(244,162,97,0.08)', borderColor: 'rgba(244,162,97,0.4)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-primary)' }}>⚠️ 缺少普通話聲音</p>
          <p className="text-xs leading-5 mb-3" style={{ color: 'var(--color-muted)' }}>
            你的系統沒有安裝普通話 TTS 聲音，需要手動從 macOS 下載。
          </p>
          <button
            onClick={() => setShowInstall(v => !v)}
            className="text-xs font-bold underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {showInstall ? '▲ 收起安裝步驟' : '▼ 查看安裝步驟'}
          </button>
          {showInstall && (
            <ol className="mt-3 space-y-1.5 text-xs leading-5" style={{ color: 'var(--color-muted)' }}>
              <li>1. 打開 <b style={{ color: 'var(--color-text)' }}>Apple 選單 → 系統設定</b></li>
              <li>2. 搜尋「<b style={{ color: 'var(--color-text)' }}>語音內容</b>」並點入</li>
              <li>3. 點擊「<b style={{ color: 'var(--color-text)' }}>系統聲音</b>」旁的選單</li>
              <li>4. 點「<b style={{ color: 'var(--color-text)' }}>管理聲音…</b>」</li>
              <li>5. 找到 <b style={{ color: 'var(--color-realupper)' }}>Mandarin（Ting-Ting）</b> 或 <b style={{ color: 'var(--color-realupper)' }}>Chinese（Mei-Jia）</b>，點 ⬇️ 下載</li>
              <li>6. 下載完成後回此頁重新整理，即可看到新聲音</li>
            </ol>
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
    { value: 'zh-TW', label: t(lang, 'voiceZhTW') },
    { value: 'zh-CN', label: t(lang, 'voiceZhCN') },
    { value: 'zh-HK', label: t(lang, 'voiceZhHK') },
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

        {/* 聲音診斷 */}
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
