import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { AIPlayer } from '@/lib/types'

const client = new Anthropic()

const AI_NAMES = ['小花', '大明', '阿偉', '美玲', '志豪', '雅婷', '建宏', '淑芬']

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export async function POST(req: NextRequest) {
  const { term, correctAnswer } = await req.json()

  if (!term || !correctAnswer) {
    return NextResponse.json({ error: '缺少 term 或 correctAnswer' }, { status: 400 })
  }

  const prompt = `你正在扮演桌遊《瞎掰王》中的 AI 玩家。

題目詞彙：「${term}」
正確答案：「${correctAnswer}」

請生成 4 位玩家的說法，格式如下（嚴格遵守 JSON 格式）：
- 1 位「老實人」：知道正確答案，用自然、口語、帶點個人風格的方式說明，但不要說得像百科全書
- 3 位「瞎掰人」：完全不知道答案，各自編造聽起來有說服力但完全錯誤的解釋，每位風格不同（例如：裝學術派、扯生活經驗、胡扯歷史故事）

規則：
- 每個說法 2-3 句話，使用繁體中文
- 不要在說法中透露角色身份
- 瞎掰人的說法要讓人信服，不要太明顯是假的
- 老實人的說法要是正確的但表達要自然，不要一字不差地複製正確答案

請回傳以下 JSON 格式（不要有任何額外文字）：
{
  "players": [
    { "role": "realupper", "explanation": "..." },
    { "role": "nipper", "explanation": "..." },
    { "role": "nipper", "explanation": "..." },
    { "role": "nipper", "explanation": "..." }
  ]
}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'AI 回應格式錯誤' }, { status: 500 })
  }

  let parsed: { players: Array<{ role: string; explanation: string }> }
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no JSON found')
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: '解析 AI 回應失敗' }, { status: 500 })
  }

  const names = shuffleArray(AI_NAMES).slice(0, 4)
  const players: AIPlayer[] = shuffleArray(
    parsed.players.map((p, i) => ({
      id: `player_${i}`,
      name: names[i],
      role: p.role as 'realupper' | 'nipper',
      explanation: p.explanation,
    }))
  )

  return NextResponse.json({ players })
}
