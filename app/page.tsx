'use client'

import Link from 'next/link'
import { useSettings } from '@/lib/useSettings'
import { t, tArr } from '@/lib/i18n'

export default function Home() {
  const { settings, update, loaded } = useSettings()
  const lang = settings.uiLang
  const isSelf = settings.mode === 'self'

  if (!loaded) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="dot-loader flex gap-2"><span /><span /><span /></div>
      </div>
    )
  }

  const steps = isSelf ? tArr(lang, 'howToPlaySelf') : tArr(lang, 'howToPlay')

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">

        {/* Top bar */}
        <div className="w-full flex items-center justify-between">
          <div />
          <Link
            href="/settings"
            className="w-9 h-9 rounded-full flex items-center justify-center border text-base transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            title={t(lang, 'settings')}
          >
            ⚙️
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center">
          <div className="text-xs font-semibold tracking-[0.3em] mb-2" style={{ color: 'var(--color-primary)' }}>
            {t(lang, 'brand')}
          </div>
          <h1 className="text-6xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            {t(lang, 'gameTitle')}
          </h1>
          <p className="mt-3 text-base" style={{ color: 'var(--color-muted)' }}>
            {t(lang, 'gameSubtitle')}
          </p>
        </div>

        {/* 模式選擇 */}
        <div className="w-full grid grid-cols-2 gap-3">
          {(
            [
              { mode: 'self', label: t(lang, 'modeSelf'), desc: t(lang, 'modeSelfDesc'), disabled: false },
              { mode: 'online', label: t(lang, 'modeOnline'), desc: t(lang, 'modeOnlineDesc'), disabled: true },
            ] as const
          ).map(item => (
            <div
              key={item.mode}
              onClick={() => !item.disabled && update({ mode: item.mode })}
              className="rounded-2xl p-4 border flex flex-col gap-1 transition-all"
              style={{
                background: settings.mode === item.mode ? 'rgba(244,162,97,0.12)' : 'var(--bg-card)',
                borderColor: settings.mode === item.mode ? 'var(--color-primary)' : 'var(--color-border)',
                opacity: item.disabled ? 0.45 : 1,
                cursor: item.disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm" style={{ color: settings.mode === item.mode ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  {item.label}
                </span>
                {item.disabled && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}>
                    {t(lang, 'comingSoon')}
                  </span>
                )}
              </div>
              <p className="text-xs leading-4" style={{ color: 'var(--color-muted)' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* 角色說明 */}
        <div className="w-full grid grid-cols-3 gap-3">
          {[
            { emoji: '🤔', name: t(lang, 'roleGuesser'), desc: t(lang, 'roleGuesserDesc'), color: 'var(--color-guesser)' },
            { emoji: '✅', name: t(lang, 'roleRealupper'), desc: t(lang, 'roleRealupperDesc'), color: 'var(--color-realupper)' },
            { emoji: '😈', name: t(lang, 'roleNipper'), desc: t(lang, 'roleNipperDesc'), color: 'var(--color-nipper)' },
          ].map(r => (
            <div key={r.name} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              <div className="text-2xl">{r.emoji}</div>
              <div className="text-xs font-bold" style={{ color: r.color }}>{r.name}</div>
              <div className="text-xs text-center leading-4" style={{ color: 'var(--color-muted)' }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* 遊戲說明 */}
        <div className="w-full rounded-2xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="font-bold mb-3 text-sm" style={{ color: 'var(--color-primary)' }}>
            {t(lang, 'howToPlayTitle')}
          </h2>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* 開始遊戲 */}
        <Link
          href="/game"
          className="w-full py-4 rounded-2xl text-center font-black text-lg transition-all active:scale-95"
          style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
        >
          {t(lang, 'startGame')}
        </Link>

        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {t(lang, 'roundsNote')} · {t(lang, isSelf ? 'modeSelf' : 'modeOnline')}
        </p>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'var(--color-muted)', opacity: 0.45 }}>
          © 2026 Made by{' '}
          <a
            href="https://www.linkedin.com/in/howardddwu1920441b6/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            @howardddwu
          </a>
        </p>
      </div>
    </div>
  )
}
