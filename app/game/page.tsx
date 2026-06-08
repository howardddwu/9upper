'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { GameState } from '@/lib/types'
import { getRandomQuestions } from '@/lib/questions'
import { useVoice } from '@/lib/useVoice'
import { useSettings } from '@/lib/useSettings'
import { t } from '@/lib/i18n'
import { getVoiceScripts } from '@/lib/voiceScripts'

function initState(): GameState {
  return {
    phase: 'home',
    currentQuestion: null,
    players: [],
    humanVote: null,
    roundResult: null,
    usedQuestionIds: [],
  }
}

// ─── Difficulty stars ──────────────────────────────────────────────────────────

function DifficultyStars({ level, lang }: { level: 1 | 2 | 3; lang: import('@/lib/settings').UILang }) {
  const key = (`difficulty${level}`) as 'difficulty1' | 'difficulty2' | 'difficulty3'
  return (
    <span className="text-xs font-mono" style={{ color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
      {t(lang, key)}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GamePage() {
  const { settings, loaded } = useSettings()
  const lang = settings.uiLang
  const vs = getVoiceScripts(settings.voiceLang)

  const [state, setState] = useState<GameState>(initState)
  const [peeked, setPeeked] = useState(false)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const { speak, stop, isMuted, toggleMute } = useVoice(settings.voiceLang)

  const startRound = useCallback(() => {
    const [question] = getRandomQuestions(1, state.usedQuestionIds)
    if (!question) return
    setPeeked(false)
    setAnswerRevealed(false)
    setState(s => ({ ...s, phase: 'question_reveal', currentQuestion: question, humanVote: null, roundResult: null }))
    speak(vs.startRound(question.term))
  }, [state.usedQuestionIds, speak, vs])

  const goExplaining = useCallback(() => {
    setState(s => ({ ...s, phase: 'explanations' }))
    speak(vs.goExplaining(state.currentQuestion?.term ?? ''))
  }, [state.currentQuestion, speak, vs])

  const goVoting = useCallback(() => {
    setAnswerRevealed(false)
    setState(s => ({ ...s, phase: 'voting' }))
    speak(vs.goVoting())
  }, [speak, vs])

  const revealAnswer = useCallback(() => {
    setAnswerRevealed(true)
    speak(vs.revealAnswer())
  }, [speak, vs])

  const recordResult = useCallback((correct: boolean) => {
    setState(s => ({
      ...s,
      phase: 'result',
      roundResult: correct ? 'correct' : 'wrong',
      usedQuestionIds: s.currentQuestion ? [...s.usedQuestionIds, s.currentQuestion.id] : s.usedQuestionIds,
    }))
    speak(correct ? vs.resultCorrect() : vs.resultWrong())
  }, [speak, vs])

  const swapQuestion = useCallback(() => {
    // Exclude used questions + current question so we never draw the same card again
    const currentId = state.currentQuestion?.id
    const excludeIds = currentId
      ? [...state.usedQuestionIds, currentId]
      : state.usedQuestionIds
    const [newQuestion] = getRandomQuestions(1, excludeIds)
    if (!newQuestion) return
    setPeeked(false)
    setState(s => ({ ...s, currentQuestion: newQuestion }))
    speak(vs.startRound(newQuestion.term))
  }, [state.usedQuestionIds, state.currentQuestion, speak, vs])

  const nextRound = useCallback(() => {
    const remaining = getRandomQuestions(1, state.usedQuestionIds)
    if (remaining.length === 0) {
      setState(s => ({ ...s, phase: 'game_over' }))
      speak(vs.gameOver())
    } else {
      setState(s => ({ ...s, phase: 'home' }))
      speak(vs.nextRound())
    }
  }, [state.usedQuestionIds, speak, vs])

  const restart = useCallback(() => {
    stop()
    setState(initState())
  }, [stop])

  if (!loaded) {
    return (
      <div className="min-h-svh flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="dot-loader flex gap-2"><span /><span /><span /></div>
      </div>
    )
  }

  const usedCount = state.usedQuestionIds.length

  return (
    <div className="min-h-svh flex flex-col items-center px-4 py-8" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col gap-4">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          {state.phase !== 'game_over' ? (
            <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
              {t(lang, 'backHome')}
            </Link>
          ) : <div />}
          <button
            onClick={toggleMute}
            title={isMuted ? t(lang, 'unmuteTitle') : t(lang, 'muteTitle')}
            className="w-9 h-9 rounded-full flex items-center justify-center border text-base transition-all"
            style={{
              background: isMuted ? 'rgba(230,57,70,0.15)' : 'var(--bg-card)',
              borderColor: isMuted ? 'var(--color-nipper)' : 'var(--color-border)',
            }}
          >
            {isMuted ? t(lang, 'muteOn') : t(lang, 'muteOff')}
          </button>
        </div>

        {/* ── home ── */}
        {state.phase === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[72svh] gap-6">
            <div
              className="w-full rounded-2xl p-5 border text-sm space-y-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <p className="font-bold mb-3" style={{ color: 'var(--color-primary)' }}>{t(lang, 'pleaseAssignRoles')}</p>
              {[
                { emoji: '🤔', color: 'var(--color-guesser)', role: t(lang, 'roleGuesser'), note: t(lang, 'roleGuesserNote'), count: '× 1' },
                { emoji: '✅', color: 'var(--color-realupper)', role: t(lang, 'roleRealupper'), note: t(lang, 'roleRealupperNote'), count: '× 1' },
                { emoji: '😈', color: 'var(--color-nipper)', role: t(lang, 'roleNipper'), note: t(lang, 'roleNipperNote'), count: `× ${t(lang, 'roleOthers')}` },
              ].map(r => (
                <div key={r.role} className="flex items-start gap-3" style={{ color: 'var(--color-muted)' }}>
                  <span>{r.emoji}</span>
                  <span>
                    <b style={{ color: r.color }}>{r.role}</b>
                    <span className="ml-1 opacity-60 text-xs">{r.count}</span>
                    {'　'}{r.note}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <div className="text-5xl mb-3">🃏</div>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>{t(lang, 'readyFlip')}</p>
              {usedCount > 0 && (
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)', opacity: 0.6 }}>
                  已玩 {usedCount} 題
                </p>
              )}
            </div>

            <button
              onClick={startRound}
              className="px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 animate-pulse-glow"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              {t(lang, 'flipCard')}
            </button>
          </div>
        )}

        {/* ── question_reveal ── */}
        {state.phase === 'question_reveal' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">

            <div className="rounded-2xl px-4 py-3 border text-sm text-center" style={{ background: 'rgba(168,218,220,0.08)', borderColor: 'var(--color-guesser)' }}>
              <span style={{ color: 'var(--color-guesser)' }}>{t(lang, 'stepGuesserClose')}</span>
              <span className="mx-3" style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-realupper)' }}>{t(lang, 'stepRealupperPeek')}</span>
              <span className="mx-3" style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-nipper)' }}>{t(lang, 'stepNipperWait')}</span>
            </div>

            <div className="rounded-3xl p-8 text-center border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-center mb-3">
                <DifficultyStars level={state.currentQuestion.difficulty} lang={lang} />
              </div>
              <h2 className="text-4xl font-black leading-tight" style={{ color: 'var(--color-text)' }}>
                {state.currentQuestion.term}
              </h2>
            </div>

            {/* 老實人 peek */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: peeked ? 'var(--color-realupper)' : 'var(--color-border)' }}>
              <button
                onClick={() => setPeeked(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 transition-all"
                style={{ background: peeked ? 'rgba(46,204,113,0.12)' : 'var(--bg-card)' }}
              >
                <span className="font-bold text-sm" style={{ color: peeked ? 'var(--color-realupper)' : 'var(--color-muted)' }}>
                  {peeked ? t(lang, 'peekedBtn') : t(lang, 'peekBtn')}
                </span>
                <span style={{ color: 'var(--color-muted)' }}>{peeked ? '▲' : '▼'}</span>
              </button>
              {peeked && (
                <div className="px-5 pb-5 pt-2 animate-fade-in-up" style={{ background: 'rgba(46,204,113,0.06)' }}>
                  <p className="text-sm leading-7" style={{ color: 'var(--color-text)' }}>
                    {state.currentQuestion.correctAnswer}
                  </p>
                </div>
              )}
            </div>

            {/* 瞎掰靈感 hints */}
            <div className="rounded-2xl px-4 py-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--color-nipper)' }}>
                😈 {t(lang, 'hintsLabel')}
              </p>
              <div className="flex gap-2 flex-wrap">
                {state.currentQuestion.hints.map((hint, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border"
                    style={{ background: 'rgba(230,57,70,0.08)', borderColor: 'rgba(230,57,70,0.25)', color: 'var(--color-text)' }}
                  >
                    {hint}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <button onClick={goExplaining} className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                {t(lang, 'startExplaining')}
              </button>
              {(() => {
                const currentId = state.currentQuestion?.id
                const excludeIds = currentId ? [...state.usedQuestionIds, currentId] : state.usedQuestionIds
                const canSwap = getRandomQuestions(1, excludeIds).length > 0
                return (
                  <button
                    onClick={swapQuestion}
                    disabled={!canSwap}
                    className="w-full py-3 rounded-2xl font-bold text-sm border transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'transparent' }}
                  >
                    {canSwap ? `🔄 ${t(lang, 'swapQuestion')}` : t(lang, 'noMoreSwap')}
                  </button>
                )
              })()}
            </div>
          </div>
        )}

        {/* ── explanations ── */}
        {state.phase === 'explanations' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <div className="rounded-2xl p-5 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              <div className="text-4xl mb-3">🗣️</div>
              <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>{t(lang, 'explainPhase')}</h2>
              <p className="text-sm mt-2 leading-6" style={{ color: 'var(--color-muted)' }}>{t(lang, 'explainDesc')}</p>
              <div className="mt-3 px-4 py-2 rounded-xl inline-block font-bold text-lg" style={{ background: 'rgba(244,162,97,0.15)', color: 'var(--color-primary)' }}>
                「{state.currentQuestion.term}」
              </div>
            </div>
            <div className="space-y-2">
              {[
                { emoji: '✅', role: t(lang, 'roleRealupper'), hint: t(lang, 'realupperHint'), color: 'var(--color-realupper)' },
                { emoji: '😈', role: t(lang, 'roleNipper'), hint: t(lang, 'nipperHint'), color: 'var(--color-nipper)' },
                { emoji: '🤔', role: t(lang, 'roleGuesser'), hint: t(lang, 'guesserHint'), color: 'var(--color-guesser)' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl px-4 py-3 flex items-center gap-3 border animate-fade-in-up" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)', animationDelay: `${i * 80}ms` }}>
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <span className="font-bold text-sm" style={{ color: item.color }}>{item.role}</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--color-muted)' }}>{item.hint}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={goVoting} className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 mt-2" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
              {t(lang, 'doneExplaining')}
            </button>
          </div>
        )}

        {/* ── voting ── */}
        {state.phase === 'voting' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            {!answerRevealed ? (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-3">🤔</div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>{t(lang, 'guessPhase')}</h2>
                  <p className="text-sm mt-2 whitespace-pre-line" style={{ color: 'var(--color-muted)' }}>{t(lang, 'guessHint')}</p>
                </div>
                <div className="rounded-2xl p-5 border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>{t(lang, 'termLabel')}</p>
                  <p className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>{state.currentQuestion.term}</p>
                </div>
                <button onClick={revealAnswer} className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95 animate-pulse-glow" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                  {t(lang, 'revealBtn')}
                </button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>{t(lang, 'revealedTitle')}</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{t(lang, 'revealedHint')}</p>
                </div>
                <div className="rounded-2xl p-5 border animate-fade-in-up" style={{ background: 'rgba(46,204,113,0.08)', borderColor: 'var(--color-realupper)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-realupper)' }}>{t(lang, 'correctAnswer')}</div>
                  <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{state.currentQuestion.term}</div>
                  <p className="text-sm leading-6" style={{ color: 'var(--color-muted)' }}>{state.currentQuestion.correctAnswer}</p>
                </div>
                <p className="text-center text-sm font-bold" style={{ color: 'var(--color-text)' }}>{t(lang, 'revealedHint')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => recordResult(true)} className="py-5 rounded-2xl font-black text-lg transition-all active:scale-95 flex flex-col items-center gap-1" style={{ background: 'rgba(46,204,113,0.15)', border: '2px solid var(--color-realupper)', color: 'var(--color-realupper)' }}>
                    <span>✅</span>
                    <span className="text-sm">{t(lang, 'guessCorrect')}</span>
                  </button>
                  <button onClick={() => recordResult(false)} className="py-5 rounded-2xl font-black text-lg transition-all active:scale-95 flex flex-col items-center gap-1" style={{ background: 'rgba(230,57,70,0.1)', border: '2px solid var(--color-nipper)', color: 'var(--color-nipper)' }}>
                    <span>❌</span>
                    <span className="text-sm">{t(lang, 'guessWrong')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── result ── */}
        {state.phase === 'result' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <div className="rounded-2xl p-6 text-center border" style={{ background: state.roundResult === 'correct' ? 'rgba(46,204,113,0.1)' : 'rgba(230,57,70,0.1)', borderColor: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)' }}>
              <div className="text-5xl mb-3">{state.roundResult === 'correct' ? '🎉' : '😅'}</div>
              <h2 className="text-2xl font-black" style={{ color: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)' }}>
                {t(lang, state.roundResult === 'correct' ? 'resultCorrect' : 'resultWrong')}
              </h2>
            </div>
            <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-primary)' }}>{t(lang, 'correctAnswer')}</div>
              <div className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>{state.currentQuestion.term}</div>
              <p className="text-sm leading-6" style={{ color: 'var(--color-muted)' }}>{state.currentQuestion.correctAnswer}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={nextRound} className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                {t(lang, 'nextRound')}
              </button>
              <Link href="/" className="w-full py-3 rounded-2xl font-bold text-center border text-sm transition-all active:scale-95" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                {t(lang, 'backHome')}
              </Link>
            </div>
          </div>
        )}

        {/* ── game_over (questions exhausted) ── */}
        {state.phase === 'game_over' && (
          <div className="flex flex-col items-center justify-center min-h-[80svh] gap-6 animate-fade-in-up">
            <div className="text-center">
              <div className="text-6xl mb-4">🎊</div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>{t(lang, 'gameOver')}</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                共玩了 {usedCount} 題
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button onClick={restart} className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                {t(lang, 'playAgain')}
              </button>
              <Link href="/" className="w-full py-4 rounded-2xl font-bold text-center border transition-all active:scale-95" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                {t(lang, 'backHome')}
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
