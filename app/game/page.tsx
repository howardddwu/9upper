'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { GameState } from '@/lib/types'
import { getRandomQuestions } from '@/lib/questions'
import { useVoice } from '@/lib/useVoice'

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

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ round, maxRounds, score }: { round: number; maxRounds: number; score: number }) {
  return (
    <div className="flex items-center justify-between text-sm mb-5">
      <span style={{ color: 'var(--color-muted)' }}>第 {round} / {maxRounds} 回合</span>
      <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{score} 分</span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GamePage() {
  const [state, setState] = useState<GameState>(initState)
  const [peeked, setPeeked] = useState(false)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const { speak, stop, isMuted, toggleMute } = useVoice()

  // ── home → question_reveal ──────────────────────────────────────────────────
  const startRound = useCallback(() => {
    const [question] = getRandomQuestions(1, state.usedQuestionIds)
    if (!question) return
    setPeeked(false)
    setAnswerRevealed(false)
    setState(s => ({
      ...s,
      phase: 'question_reveal',
      currentQuestion: question,
      humanVote: null,
      roundResult: null,
    }))
    speak(
      `第${state.round}回合！翻牌！題目是「${question.term}」。` +
      `想想請閉上眼睛。老實人，請偷偷點開謎底，記住正確答案。`
    )
  }, [state.usedQuestionIds, state.round, speak])

  // ── question_reveal → explanations ─────────────────────────────────────────
  const goExplaining = useCallback(() => {
    setState(s => ({ ...s, phase: 'explanations' }))
    speak(
      `好，天亮了！現在每位玩家，包括老實人和瞎掰人，` +
      `輪流對「${state.currentQuestion?.term}」給出你的解釋。` +
      `老實人請說真話，瞎掰人請發揮創意！想想，請仔細聆聽！`
    )
  }, [state.currentQuestion, speak])

  // ── explanations → voting ───────────────────────────────────────────────────
  const goVoting = useCallback(() => {
    setAnswerRevealed(false)
    setState(s => ({ ...s, phase: 'voting' }))
    speak(
      `說明結束！想想，根據大家的解釋，` +
      `你認為誰是老實人？說出你的答案！準備好後，揭曉謎底！`
    )
  }, [speak])

  // ── 揭曉謎底 ────────────────────────────────────────────────────────────────
  const revealAnswer = useCallback(() => {
    setAnswerRevealed(true)
    speak(`謎底揭曉！看看想想猜對了嗎？`)
  }, [speak])

  // ── 記分：猜對 / 猜錯 ───────────────────────────────────────────────────────
  const recordResult = useCallback((correct: boolean) => {
    setState(s => ({
      ...s,
      phase: 'result',
      roundResult: correct ? 'correct' : 'wrong',
      score: correct ? s.score + 2 : s.score,
      usedQuestionIds: s.currentQuestion
        ? [...s.usedQuestionIds, s.currentQuestion.id]
        : s.usedQuestionIds,
    }))
    if (correct) {
      speak(`恭喜！想想猜對了！想想和老實人各得兩分！`)
    } else {
      speak(`哎！想想被瞎掰人騙了！這次得分為零。`)
    }
  }, [speak])

  // ── result → next ───────────────────────────────────────────────────────────
  const nextRound = useCallback(() => {
    if (state.round >= state.maxRounds) {
      setState(s => ({ ...s, phase: 'game_over' }))
      speak(
        `遊戲結束！總得分是${state.score}分，滿分${state.maxRounds * 2}分。` +
        `感謝大家參與瞎掰王！`
      )
    } else {
      const nextRound = state.round + 1
      setState(s => ({ ...s, round: nextRound, phase: 'home' }))
      speak(`第${nextRound}回合即將開始！請準備好，翻開下一張題目卡！`)
    }
  }, [state.round, state.maxRounds, state.score, speak])

  const restart = useCallback(() => {
    stop()
    setState(initState())
  }, [stop])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-svh flex flex-col items-center px-4 py-8" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col gap-4">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          {state.phase !== 'game_over' ? (
            <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
              ← 返回首頁
            </Link>
          ) : (
            <div />
          )}
          {/* 靜音按鈕 */}
          <button
            onClick={toggleMute}
            title={isMuted ? '開啟語音' : '靜音'}
            className="w-9 h-9 rounded-full flex items-center justify-center border text-base transition-all"
            style={{
              background: isMuted ? 'rgba(230,57,70,0.15)' : 'var(--bg-card)',
              borderColor: isMuted ? 'var(--color-nipper)' : 'var(--color-border)',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* ── home ── */}
        {state.phase === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[72svh] gap-6">
            {/* 角色分配提示 */}
            <div
              className="w-full rounded-2xl p-5 border text-sm space-y-2"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <p className="font-bold mb-3" style={{ color: 'var(--color-primary)' }}>請先分配角色</p>
              <div className="flex items-start gap-3" style={{ color: 'var(--color-muted)' }}>
                <span>🤔</span><span><b style={{ color: 'var(--color-guesser)' }}>想想</b> × 1　負責猜測，先閉眼</span>
              </div>
              <div className="flex items-start gap-3" style={{ color: 'var(--color-muted)' }}>
                <span>✅</span><span><b style={{ color: 'var(--color-realupper)' }}>老實人</b> × 1　偷看謎底，說真話</span>
              </div>
              <div className="flex items-start gap-3" style={{ color: 'var(--color-muted)' }}>
                <span>😈</span><span><b style={{ color: 'var(--color-nipper)' }}>瞎掰人</b> × 其餘　不知答案，盡力唬爛</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-3">🃏</div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
                第 {state.round} 回合
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                分配好角色後，翻開題目卡！
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

        {/* ── question_reveal ── */}
        {state.phase === 'question_reveal' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            {/* 流程指示 */}
            <div
              className="rounded-2xl px-4 py-3 border text-sm text-center"
              style={{ background: 'rgba(168,218,220,0.08)', borderColor: 'var(--color-guesser)' }}
            >
              <span style={{ color: 'var(--color-guesser)' }}>① 想想閉眼</span>
              <span className="mx-3" style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-realupper)' }}>② 老實人偷看</span>
              <span className="mx-3" style={{ color: 'var(--color-border)' }}>|</span>
              <span style={{ color: 'var(--color-nipper)' }}>③ 瞎掰人等待</span>
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

            {/* 老實人偷看謎底 */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: peeked ? 'var(--color-realupper)' : 'var(--color-border)' }}
            >
              <button
                onClick={() => setPeeked(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 transition-all"
                style={{ background: peeked ? 'rgba(46,204,113,0.12)' : 'var(--bg-card)' }}
              >
                <span className="font-bold text-sm" style={{ color: peeked ? 'var(--color-realupper)' : 'var(--color-muted)' }}>
                  {peeked ? '✅ 老實人已看到謎底' : '🔒 老實人：點此偷看謎底'}
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

            <button
              onClick={goExplaining}
              className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 mt-1"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              天亮了！開始說明 →
            </button>
          </div>
        )}

        {/* ── explanations ── */}
        {state.phase === 'explanations' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            <div
              className="rounded-2xl p-5 border text-center"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-4xl mb-3">🗣️</div>
              <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>說明階段</h2>
              <p className="text-sm mt-2 leading-6" style={{ color: 'var(--color-muted)' }}>
                所有玩家輪流解釋
              </p>
              <div
                className="mt-3 px-4 py-2 rounded-xl inline-block font-bold text-lg"
                style={{ background: 'rgba(244,162,97,0.15)', color: 'var(--color-primary)' }}
              >
                「{state.currentQuestion.term}」
              </div>
            </div>

            {/* 玩家提示 */}
            <div className="space-y-2">
              {[
                { emoji: '✅', label: '老實人', desc: '用自己的話解釋真正的意思', color: 'var(--color-realupper)' },
                { emoji: '😈', label: '瞎掰人', desc: '一本正經地胡說八道！', color: 'var(--color-nipper)' },
                { emoji: '🤔', label: '想想', desc: '仔細聽，找出誰在說真話', color: 'var(--color-guesser)' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex items-center gap-3 border animate-fade-in-up"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)', animationDelay: `${i * 80}ms` }}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <div>
                    <span className="font-bold text-sm" style={{ color: item.color }}>{item.label}</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--color-muted)' }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goVoting}
              className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 mt-2"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              大家說完了！開始猜測 →
            </button>
          </div>
        )}

        {/* ── voting ── */}
        {state.phase === 'voting' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            {!answerRevealed ? (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-3">🤔</div>
                  <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>
                    想想，你的答案是？
                  </h2>
                  <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                    向大家說出你認為的老實人<br />準備好後，揭曉謎底！
                  </p>
                </div>

                <div
                  className="rounded-2xl p-5 border text-center"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
                >
                  <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>本題詞彙</p>
                  <p className="text-2xl font-black" style={{ color: 'var(--color-text)' }}>
                    {state.currentQuestion.term}
                  </p>
                </div>

                <button
                  onClick={revealAnswer}
                  className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95 animate-pulse-glow"
                  style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
                >
                  🎯 揭曉謎底！
                </button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-xl font-black" style={{ color: 'var(--color-text)' }}>謎底揭曉！</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    想想猜對了嗎？
                  </p>
                </div>

                {/* 正確答案 */}
                <div
                  className="rounded-2xl p-5 border animate-fade-in-up"
                  style={{ background: 'rgba(46,204,113,0.08)', borderColor: 'var(--color-realupper)' }}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--color-realupper)' }}>正確答案</div>
                  <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{state.currentQuestion.term}</div>
                  <p className="text-sm leading-6" style={{ color: 'var(--color-muted)' }}>
                    {state.currentQuestion.correctAnswer}
                  </p>
                </div>

                <p className="text-center text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  想想猜對了嗎？
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => recordResult(true)}
                    className="py-5 rounded-2xl font-black text-lg transition-all active:scale-95 flex flex-col items-center gap-1"
                    style={{ background: 'rgba(46,204,113,0.15)', border: '2px solid var(--color-realupper)', color: 'var(--color-realupper)' }}
                  >
                    <span>✅</span>
                    <span className="text-sm">猜對了！</span>
                    <span className="text-xs font-normal opacity-70">+2 分</span>
                  </button>
                  <button
                    onClick={() => recordResult(false)}
                    className="py-5 rounded-2xl font-black text-lg transition-all active:scale-95 flex flex-col items-center gap-1"
                    style={{ background: 'rgba(230,57,70,0.1)', border: '2px solid var(--color-nipper)', color: 'var(--color-nipper)' }}
                  >
                    <span>❌</span>
                    <span className="text-sm">猜錯了</span>
                    <span className="text-xs font-normal opacity-70">+0 分</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── result ── */}
        {state.phase === 'result' && state.currentQuestion && (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <ScoreBar round={state.round} maxRounds={state.maxRounds} score={state.score} />

            <div
              className="rounded-2xl p-6 text-center border"
              style={{
                background: state.roundResult === 'correct' ? 'rgba(46,204,113,0.1)' : 'rgba(230,57,70,0.1)',
                borderColor: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)',
              }}
            >
              <div className="text-5xl mb-3">{state.roundResult === 'correct' ? '🎉' : '😅'}</div>
              <h2
                className="text-2xl font-black"
                style={{ color: state.roundResult === 'correct' ? 'var(--color-realupper)' : 'var(--color-nipper)' }}
              >
                {state.roundResult === 'correct' ? '想想猜對了！+2 分' : '被瞎掰人騙了！'}
              </h2>
              <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                本局得分：
                <span style={{ color: 'var(--color-primary)' }}> {state.score} 分</span>
              </p>
            </div>

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

            <button
              onClick={nextRound}
              className="w-full py-4 rounded-2xl font-bold mt-1 transition-all active:scale-95"
              style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
            >
              {state.round >= state.maxRounds ? '查看最終結果 →' : '下一回合 →'}
            </button>
          </div>
        )}

        {/* ── game_over ── */}
        {state.phase === 'game_over' && (
          <div className="flex flex-col items-center justify-center min-h-[80svh] gap-6 animate-fade-in-up">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {state.score >= 8 ? '👑' : state.score >= 4 ? '🎊' : '🤔'}
              </div>
              <h2 className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>遊戲結束！</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>共 {state.maxRounds} 回合</p>
            </div>

            <div
              className="w-full rounded-3xl p-8 text-center border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="text-6xl font-black" style={{ color: 'var(--color-primary)' }}>{state.score}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>/ {state.maxRounds * 2} 分</div>
              <div className="mt-4 font-bold" style={{ color: 'var(--color-text)' }}>
                {state.score >= 8 ? '想想大師！眼力超群！' : state.score >= 6 ? '不錯！有幾分眼力' : state.score >= 4 ? '嗯... 瞎掰人太強了' : '多練練，下次會更好！'}
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
