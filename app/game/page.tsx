'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { GameState } from '@/lib/types'
import { getRandomQuestions } from '@/lib/questions'

const MAX_ROUNDS = 5
const PLAYER_NAMES = ['小花', '大明', '阿偉', '美玲']

// 隨機決定哪位玩家是老實人（index 0–3）
function pickRealupperIndex() {
  return Math.floor(Math.random() * 4)
}

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

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ round, maxRounds, score }: { round: number; maxRounds: number; score: number }) {
  return (
    <div className="flex items-center justify-between text-sm mb-6">
      <span style={{ color: 'var(--color-muted)' }}>第 {round} / {maxRounds} 回合</span>
      <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{score} 分</span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GamePage() {
  const [state, setState] = useState<GameState>(initState)
  const [peeked, setPeeked] = useState(false)           // 是否已偷看謎底
  const [realupperIdx, setRealupperIdx] = useState(0)   // 本局老實人是哪位

  // Phase: home → question
  const startRound = useCallback(() => {
    const [question] = getRandomQuestions(1, state.usedQuestionIds)
    if (!question) return
    const idx = pickRealupperIndex()
    setRealupperIdx(idx)
    setPeeked(false)
    setState(s => ({
      ...s,
      phase: 'question_reveal',
      currentQuestion: question,
      humanVote: null,
      roundResult: null,
    }))
  }, [state.usedQuestionIds])

  // Phase: question → explaining
  const goExplaining = () => setState(s => ({ ...s, phase: 'explanations' }))

  // Phase: explaining → voting
  const goVoting = () => setState(s => ({ ...s, phase: 'voting' }))

  // Phase: voting → result
  const vote = (idx: number) => {
    const correct = idx === realupperIdx
    setState(s => ({
      ...s,
      humanVote: String(idx),
      phase: 'result',
      roundResult: correct ? 'correct' : 'wrong',
      score: correct ? s.score + 2 : s.score,
      usedQuestionIds: s.currentQuestion
        ? [...s.usedQuestionIds, s.currentQuestion.id]
        : s.usedQuestionIds,
    }))
  }

  // Phase: result → next or game_over
  const nextRound = () => {
    if (state.round >= state.maxRounds) {
      setState(s => ({ ...s, phase: 'game_over' }))
    } else {
      setState(s => ({ ...s, round: s.round + 1, phase: 'home' }))
    }
  }

  const restart = () => setState(initState())

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh flex flex-col items-center px-4 py-8" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col gap-4">

        {state.phase !== 'game_over' && (
          <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
            ← 返回首頁
          </Link>
        )}

        {/* ── home ── */}
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
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              目前得分：<span style={{ color: 'var(--color-primary)' }}>{state.score} 分</span>
            </p>
          </div>
        )}

        {/* ── question_reveal：展示題目 + 老實人偷看謎底 ── */}
        {state.phase === 'question_reveal' && state.currentQuestion && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            {/* 角色提示 */}
            <div
              className="rounded-2xl px-4 py-3 text-center text-sm border"
              style={{ background: 'rgba(168,218,220,0.08)', borderColor: 'var(--color-guesser)' }}
            >
              <span style={{ color: 'var(--color-guesser)' }}>🤔 想想請閉眼</span>
              <span className="mx-2" style={{ color: 'var(--color-muted)' }}>·</span>
              <span style={{ color: 'var(--color-realupper)' }}>老實人偷看謎底</span>
              <span className="mx-2" style={{ color: 'var(--color-muted)' }}>·</span>
              <span style={{ color: 'var(--color-nipper)' }}>瞎掰人等著</span>
            </div>

            {/* 題目卡 */}
            <div
              className="rounded-3xl p-8 text-center border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-xs font-semibold tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
                {state.currentQuestion.category}
              </div>
              <h2 className="text-4xl font-black leading-tight" style={{ color: 'var(--color-text)' }}>
                {state.currentQuestion.term}
              </h2>
            </div>

            {/* 謎底卡：點開才能看 */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: peeked ? 'var(--color-realupper)' : 'var(--color-border)' }}
            >
              {/* Header */}
              <button
                onClick={() => setPeeked(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 transition-all"
                style={{
                  background: peeked ? 'rgba(46,204,113,0.12)' : 'var(--bg-card)',
                }}
              >
                <span className="font-bold text-sm" style={{ color: peeked ? 'var(--color-realupper)' : 'var(--color-muted)' }}>
                  {peeked ? '✅ 老實人已看到謎底' : '🔒 老實人：點此偷看謎底'}
                </span>
                <span style={{ color: 'var(--color-muted)' }}>{peeked ? '▲' : '▼'}</span>
              </button>

              {/* 謎底內容 */}
              {peeked && (
                <div
                  className="px-5 pb-5 pt-1 animate-fade-in-up"
                  style={{ background: 'rgba(46,204,113,0.06)' }}
                >
                  <p className="text-sm leading-7" style={{ color: 'var(--color-text)' }}>
                    {state.currentQuestion.correctAnswer}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={goExplaining}
              className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              好了，天亮了！開始說明 →
            </button>
          </div>
        )}

        {/* ── explanations：說明階段 ── */}
        {state.phase === 'explanations' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            <div className="text-center">
              <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>說明階段</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                各玩家輪流解釋「{state.currentQuestion.term}」的意思
              </p>
            </div>

            {/* 玩家說明列表 */}
            {PLAYER_NAMES.map((name, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 border animate-fade-in-up"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--color-border)',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🎭</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{name}</span>
                </div>
                <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>
                  「{name} 正在一本正經地解釋中...」
                </p>
              </div>
            ))}

            <div
              className="rounded-2xl p-4 text-center border"
              style={{ background: 'rgba(244,162,97,0.06)', borderColor: 'rgba(244,162,97,0.3)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-primary)' }}>
                🤔 <strong>你是想想</strong>，仔細聽每位玩家的解釋，試著找出誰在說真話！
              </p>
            </div>

            <button
              onClick={goVoting}
              className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              大家說完了，開始投票！
            </button>
          </div>
        )}

        {/* ── voting：投票 ── */}
        {state.phase === 'voting' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            <div className="text-center">
              <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>你覺得誰是老實人？</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>點選你認為說真話的那位</p>
            </div>

            {PLAYER_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => vote(i)}
                className="w-full rounded-2xl p-5 text-left border transition-all active:scale-95 animate-fade-in-up"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--color-border)',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎭</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{name}</span>
                  <span className="ml-auto text-sm" style={{ color: 'var(--color-muted)' }}>選他 →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── result：結果 ── */}
        {state.phase === 'result' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            {/* 結果 banner */}
            <div
              className="rounded-2xl p-5 text-center border"
              style={{
                background: state.roundResult === 'correct' ? 'rgba(46,204,113,0.1)' : 'rgba(230,57,70,0.1)',
                borderColor: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)',
              }}
            >
              <div className="text-4xl mb-2">{state.roundResult === 'correct' ? '🎉' : '😅'}</div>
              <h2
                className="text-xl font-black"
                style={{ color: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)' }}
              >
                {state.roundResult === 'correct' ? '猜對了！+2 分' : '被騙了！'}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                {state.roundResult === 'correct' ? '你成功找出老實人！' : '瞎掰人把你騙過去了'}
              </p>
            </div>

            {/* 正確答案 */}
            <div className="rounded-2xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-primary)' }}>正確答案</div>
              <div className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>{state.currentQuestion.term}</div>
              <p className="text-sm leading-6" style={{ color: 'var(--color-muted)' }}>
                {state.currentQuestion.correctAnswer}
              </p>
            </div>

            {/* 揭曉所有玩家身份 */}
            <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>真相揭曉</p>
            {PLAYER_NAMES.map((name, i) => {
              const isRealupper = i === realupperIdx
              const isVoted = state.humanVote === String(i)
              return (
                <div
                  key={i}
                  className="rounded-2xl p-4 border animate-fade-in-up"
                  style={{
                    background: isRealupper ? 'rgba(46,204,113,0.08)' : 'rgba(230,57,70,0.06)',
                    borderColor: isRealupper ? 'var(--color-realupper)' : 'var(--color-nipper)',
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isRealupper ? '✅' : '😈'}</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{name}</span>
                    <span
                      className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: isRealupper ? 'var(--color-realupper)' : 'var(--color-nipper)',
                        color: '#0f0e17',
                      }}
                    >
                      {isRealupper ? '老實人' : '瞎掰人'}
                    </span>
                    {isVoted && (
                      <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                        你選的
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              onClick={nextRound}
              className="w-full py-4 rounded-2xl font-bold mt-2 transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              {state.round >= state.maxRounds ? '查看最終結果' : '下一題 →'}
            </button>
          </div>
        )}

        {/* ── game_over ── */}
        {state.phase === 'game_over' && (
          <div className="flex flex-col items-center justify-center min-h-[80svh] gap-6 animate-fade-in-up">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {state.score >= 8 ? '👑' : state.score >= 4 ? '😊' : '🤔'}
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>遊戲結束！</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>共 {state.maxRounds} 回合</p>
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
                  : '練練再來！'}
              </div>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={restart}
                className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95"
                style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
              >
                再玩一次
              </button>
              <Link
                href="/"
                className="w-full py-4 rounded-2xl font-bold text-center border transition-all active:scale-95"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                回首頁
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
