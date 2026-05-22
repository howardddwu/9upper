'use client'

import Link from 'next/link'
import { useSettings } from '@/lib/useSettings'
import { UILang, VoiceLang, GameMode } from '@/lib/settings'
import { t } from '@/lib/i18n'

type OptionItem<T> = { value: T; label: string; sub?: string; disabled?: boolean }

function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: OptionItem<T>[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => !opt.disabled && onChange(opt.value)}
          disabled={opt.disabled}
          className="w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-left"
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
            {opt.sub && (
              <span className="text-xs ml-2" style={{ color: 'var(--color-muted)' }}>{opt.sub}</span>
            )}
          </div>
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{ borderColor: value === opt.value ? 'var(--color-primary)' : 'var(--color-muted)' }}
          >
            {value === opt.value && (
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
            )}
          </div>
        </button>
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
    { value: 'self', label: t(lang, 'modeSelf'), sub: t(lang, 'modeSelfDesc') },
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center border text-sm transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            ←
          </Link>
          <h1 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>
            {t(lang, 'settingsTitle')}
          </h1>
        </div>

        {/* 遊戲模式 */}
        <SectionLabel label={t(lang, 'modeLabel')} />
        <OptionGroup
          options={modeOptions}
          value={settings.mode}
          onChange={v => update({ mode: v })}
        />

        {/* 介面語言 */}
        <SectionLabel label={t(lang, 'langLabel')} />
        <OptionGroup
          options={uiLangOptions}
          value={settings.uiLang}
          onChange={v => update({ uiLang: v as UILang })}
        />

        {/* 語音語言 */}
        <SectionLabel label={t(lang, 'voiceLabel')} />
        <OptionGroup
          options={voiceLangOptions}
          value={settings.voiceLang}
          onChange={v => update({ voiceLang: v as VoiceLang })}
        />

        {/* 進階設定（佔位） */}
        <SectionLabel label={t(lang, 'advancedLabel')} />
        <div
          className="rounded-xl px-4 py-4 border text-sm text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          {t(lang, 'advancedNote')} 🚧
        </div>

        {/* 版本 */}
        <p className="text-xs text-center mt-8" style={{ color: 'var(--color-muted)' }}>
          瞎掰王 v0.1 · 9UPPER
        </p>
      </div>
    </div>
  )
}
