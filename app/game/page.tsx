'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { GameState, AIPlayer } from '@/lib/types'
import { getRandomQuestions } from '@/lib/questions'

const MAX_ROUNDS = 5

function initState(): GameState {
  return {
    phase: 'home',
    round: 1,
    maxRounds: MAX_ROUNDS,
    currentQuestion: null,
    players: [],
    humanVote: null,
    score: 0,
    roundResult: null,
    usedQuestionIds: [],
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreBar({ round, maxRounds, score }: { round: number; maxRounds: number; score: number }) {
  return (
    <div className="flex items-center justify-between text-sm mb-6">
      <span style={{ color: 'var(--color-muted)' }}>
        第 {round} / {maxRounds} 回合
      </span>
      <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
        {score} 分
      </span>
    </div>
  )
}

function PlayerCard({
  player,
  index,
  selected,
  revealed,
  onClick,
}: {
  player: AIPlayer
  index: number
  selected: boolean
  revealed: boolean
  onClick?: () => void
}) {
  const isRealupper = player.role === 'realupper'
  const borderColor = revealed
    ? isRealupper
      ? 'var(--color-realupper)'
      : 'var(--color-nipper)'
    : selected
    ? 'var(--color-primary)'
    : 'var(--color-border)'

  const bg = revealed
    ? isRealupper
      ? 'rgba(46,204,113,0.08)'
      : 'rgba(230,57,70,0.06)'
    : selected
    ? 'rgba(244,162,97,0.1)'
    : 'var(--bg-card)'

  return (
    <button
      onClick={onClick}
      disabled={revealed || !onClick}
      className="w-full rounded-2xl p-4 text-left transition-all border animate-fade-in-up"
      style={{
        background: bg,
        borderColor,
        animationDelay: `${index * 80}ms`,
        cursor: onClick && !revealed ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{isRealupper && revealed ? '✅' : revealed ? '😈' : '🎭'}</span>
        <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
          {player.name}
        </span>
        {revealed && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: isRealupper ? 'var(--color-realupper)' : 'var(--color-nipper)',
              color: '#0f0e17',
            }}
          >
            {isRealupper ? '老實人' : '瞎掰人'}
          </span>
        )}
        {!revealed && selected && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
          >
            我猜是他
          </span>
        )}
      </div>
      <p className="text-sm leading-6" style={{ color: 'var(--color-muted)' }}>
        {player.explanation}
      </p>
    </button>
  )
}

// ─── Main Game Component ──────────────────────────────────────────────────────

export default function GamePage() {
  const [state, setState] = useState<GameState>(initState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async (term: string, correctAnswer: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, correctAnswer }),
      })
      if (!res.ok) throw new Error('API 請求失敗')
      const data = await res.json()
      return data.players as AIPlayer[]
    } catch {
      setError('AI 玩家生成失敗，請重試')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Phase: home → question_reveal
  const startRound = useCallback(() => {
    const [question] = getRandomQuestions(1, state.usedQuestionIds)
    if (!question) return
    setState((s) => ({
      ...s,
      phase: 'question_reveal',
      currentQuestion: question,
      players: [],
      humanVote: null,
      roundResult: null,
    }))
  }, [state.usedQuestionIds])

  // Phase: question_reveal → thinking → explanations
  useEffect(() => {
    if (state.phase !== 'question_reveal' || !state.currentQuestion) return
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, phase: 'thinking' }))
      const players = await fetchPlayers(
        state.currentQuestion!.term,
        state.currentQuestion!.correctAnswer
      )
      if (players) {
        setState((s) => ({ ...s, phase: 'explanations', players }))
      } else {
        setState((s) => ({ ...s, phase: 'question_reveal' }))
      }
    }, 2200)
    return () => clearTimeout(timer)
  }, [state.phase, state.currentQuestion, fetchPlayers])

  // Phase: explanations → voting
  const goToVoting = () => setState((s) => ({ ...s, phase: 'voting' }))

  // Phase: voting → result
  const vote = (playerId: string) => {
    setState((s) => ({ ...s, humanVote: playerId, phase: 'result' }))
  }

  // Calculate result when entering result phase
  useEffect(() => {
    if (state.phase !== 'result' || !state.humanVote) return
    const voted = state.players.find((p) => p.id === state.humanVote)
    const correct = voted?.role === 'realupper'
    setState((s) => ({
      ...s,
      roundResult: correct ? 'correct' : 'wrong',
      score: correct ? s.score + 2 : s.score,
      usedQuestionIds: s.currentQuestion
        ? [...s.usedQuestionIds, s.currentQuestion.id]
        : s.usedQuestionIds,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // Phase: result → next round or game_over
  const nextRound = () => {
    if (state.round >= state.maxRounds) {
      setState((s) => ({ ...s, phase: 'game_over' }))
    } else {
      setState((s) => ({ ...s, round: s.round + 1, phase: 'home' }))
    }
  }

  // Restart game
  const restart = () => setState(initState())

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-svh flex flex-col items-center px-4 py-8" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col gap-4">

        {/* Back link */}
        {state.phase !== 'game_over' && (
          <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
            ← 返回首頁
          </Link>
        )}

        {/* ── Phase: home ── */}
        {state.phase === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[70svh] gap-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🃏</div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
                第 {state.round} 回合
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                準備好了嗎？翻開題目卡！
              </p>
            </div>
            <button
              onClick={startRound}
              className="px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 animate-pulse-glow"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              翻開題目卡
            </button>
            <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
              目前得分：<span style={{ color: 'var(--color-primary)' }}>{state.score} 分</span>
            </div>
          </div>
        )}

        {/* ── Phase: question_reveal ── */}
        {state.phase === 'question_reveal' && state.currentQuestion && (
          <div className="flex flex-col items-center justify-center min-h-[70svh] gap-6 animate-fade-in-up">
            <div
              className="w-full rounded-3xl p-8 text-center border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--color-primary)' }}>
                {state.currentQuestion.category}
              </div>
              <h2 className="text-4xl font-black leading-tight" style={{ color: 'var(--color-text)' }}>
                {state.currentQuestion.term}
              </h2>
            </div>
            <div className="text-center space-y-2">
              <p className="font-bold" style={{ color: 'var(--color-guesser)' }}>天黑請閉眼...</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>老實人請偷看答案，AI 玩家開始思考...</p>
            </div>
          </div>
        )}

        {/* ── Phase: thinking ── */}
        {state.phase === 'thinking' && (
          <div className="flex flex-col items-center justify-center min-h-[70svh] gap-6">
            <div className="text-center">
              <div className="text-5xl mb-4">💭</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                AI 玩家正在準備說詞...
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                老實人認真思考，瞎掰人努力編故事
              </p>
              <div className="dot-loader flex gap-2 justify-center">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            {error && (
              <div className="text-sm text-center" style={{ color: 'var(--color-nipper)' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* ── Phase: explanations ── */}
        {state.phase === 'explanations' && state.currentQuestion && (
          <div className="flex flex-col gap-4">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />
            <div
              className="rounded-2xl px-4 py-3 text-center border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>題目：</span>
              <span className="font-bold ml-1" style={{ color: 'var(--color-text)' }}>
                {state.currentQuestion.term}
              </span>
            </div>
            <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
              大家的解釋
            </p>
            {state.players.map((p, i) => (
              <PlayerCard key={p.id} player={p} index={i} selected={false} revealed={false} />
            ))}
            <button
              onClick={goToVoting}
              className="w-full py-4 rounded-2xl font-bold text-base mt-2 transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              我聽完了，開始投票！
            </button>
          </div>
        )}

        {/* ── Phase: voting ── */}
        {state.phase === 'voting' && state.currentQuestion && (
          <div className="flex flex-col gap-4">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />
            <div className="text-center">
              <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>你覺得誰是老實人？</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>點選你認為說真話的那位</p>
            </div>
            {state.players.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                index={i}
                selected={state.humanVote === p.id}
                revealed={false}
                onClick={() => vote(p.id)}
              />
            ))}
          </div>
        )}

        {/* ── Phase: result ── */}
        {state.phase === 'result' && state.currentQuestion && (
          <div className="flex flex-col gap-4">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            {/* Result banner */}
            <div
              className="rounded-2xl p-5 text-center border animate-fade-in-up"
              style={{
                background: state.roundResult === 'correct' ? 'rgba(46,204,113,0.1)' : 'rgba(230,57,70,0.1)',
                borderColor: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)',
              }}
            >
              <div className="text-4xl mb-2">{state.roundResult === 'correct' ? '🎉' : '😅'}</div>
              <h2 className="text-xl font-black" style={{ color: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)' }}>
                {state.roundResult === 'correct' ? '猜對了！+2 分' : '被騙了！'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                {state.roundResult === 'correct' ? '你成功找出老實人！' : '瞎掰人把你騙過去了'}
              </p>
            </div>

            {/* Correct answer */}
            <div
              className="rounded-2xl p-4 border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-xs mb-1" style={{ color: 'var(--color-primary)' }}>正確答案</div>
              <div className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>{state.currentQuestion.term}</div>
              <p className="text-sm leading-6" style={{ color: 'var(--color-muted)' }}>
                {state.currentQuestion.correctAnswer}
              </p>
            </div>

            {/* Reveal all players */}
            <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>真相揭曉</p>
            {state.players.map((p, i) => (
              <PlayerCard
                key={p.id}
                player={p}
                index={i}
                selected={state.humanVote === p.id}
                revealed={true}
              />
            ))}

            <button
              onClick={nextRound}
              className="w-full py-4 rounded-2xl font-bold text-base mt-2 transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              {state.round >= state.maxRounds ? '查看最終結果' : `下一題 →`}
            </button>
          </div>
        )}

        {/* ── Phase: game_over ── */}
        {state.phase === 'game_over' && (
          <div className="flex flex-col items-center justify-center min-h-[80svh] gap-6 animate-fade-in-up">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {state.score >= 8 ? '👑' : state.score >= 4 ? '😊' : '🤔'}
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
                遊戲結束！
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                共 {state.maxRounds} 回合
              </p>
            </div>

            <div
              className="w-full rounded-3xl p-8 text-center border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-6xl font-black" style={{ color: 'var(--color-primary)' }}>
                {state.score}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                / {state.maxRounds * 2} 分
              </div>
              <div className="mt-4 font-bold" style={{ color: 'var(--color-text)' }}>
                {state.score >= 8
                  ? '你是真正的想想大師！'
                  : state.score >= 6
                  ? '不錯！你有不少的眼力'
                  : state.score >= 4
                  ? '嗯... 瞎掰人太厲害了吧'
                  : '被騙慘了，練練再來！'}
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={restart}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95"
                style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
              >
                再玩一次
              </button>
              <Link
                href="/"
                className="w-full py-4 rounded-2xl font-bold text-base text-center border transition-all active:scale-95"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                回首頁
              </Link>
            </div>

            {loading && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>載入中...</p>}
          </div>
        )}
      </div>
    </div>
  )
}
