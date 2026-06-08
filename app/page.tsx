'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSettings } from '@/lib/useSettings'
import { t, tArr } from '@/lib/i18n'

// ─── Feedback Drawer ──────────────────────────────────────────────────────────

const EMOJIS = ['😭', '😐', '🙂', '😄', '🤩'] as const

function FeedbackDrawer() {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  const reset = () => {
    setOpen(false)
    setRating(null)
    setComment('')
    setStatus('idle')
  }

  const submit = async () => {
    if (rating === null) return
    setStatus('submitting')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? '',
          subject: '瞎掰王 玩家回饋',
          rating: EMOJIS[rating],
          message: comment || '（未填寫）',
          from_name: '瞎掰王玩家',
        }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
        style={{ color: 'var(--color-muted)', opacity: 0.45 }}
      >
        💬 回饋
      </button>

      {/* Overlay + Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={reset}
          />

          {/* drawer */}
          <div
            className="relative z-10 rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-5 animate-slide-up"
            style={{ background: 'var(--bg-card)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}
          >
            {status === 'done' ? (
              /* ── Success ── */
              <div className="py-8 flex flex-col items-center gap-3 animate-fade-in-up">
                <div className="text-5xl">🙏</div>
                <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>謝謝你的回饋！</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>你的意見幫助瞎掰王變得更好</p>
                <button
                  onClick={reset}
                  className="mt-3 px-6 py-2 rounded-full text-sm font-bold border transition-all active:scale-95"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                >
                  關閉
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                {/* header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg" style={{ color: 'var(--color-text)' }}>
                    這次玩得怎麼樣？
                  </h3>
                  <button
                    onClick={reset}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-lg transition-colors"
                    style={{ color: 'var(--color-muted)', background: 'var(--bg-deep)' }}
                  >
                    ×
                  </button>
                </div>

                {/* emoji rating */}
                <div className="flex gap-2">
                  {EMOJIS.map((e, i) => (
                    <button
                      key={i}
                      onClick={() => setRating(i)}
                      className="flex-1 py-3 rounded-2xl text-2xl transition-all active:scale-90"
                      style={{
                        background: rating === i ? 'rgba(244,162,97,0.2)' : 'var(--bg-deep)',
                        border: `2px solid ${rating === i ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        transform: rating === i ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                {/* comment textarea */}
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="有什麼想說的？（選填）"
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors"
                  style={{
                    background: 'var(--bg-deep)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />

                {/* submit */}
                <button
                  onClick={submit}
                  disabled={rating === null || status === 'submitting'}
                  className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
                >
                  {status === 'submitting' ? '送出中…' : '送出回饋'}
                </button>

                {status === 'error' && (
                  <p className="text-center text-sm animate-fade-in-up" style={{ color: 'var(--color-nipper)' }}>
                    送出失敗，請稍後再試 😢
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────

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
        <div className="flex items-center gap-3" style={{ opacity: 0.45 }}>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
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
          <span style={{ color: 'var(--color-border)' }}>·</span>
          <FeedbackDrawer />
        </div>

      </div>
    </div>
  )
}
