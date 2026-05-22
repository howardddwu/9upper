export type GamePhase =
  | 'home'
  | 'question_reveal'
  | 'thinking'
  | 'explanations'
  | 'voting'
  | 'result'
  | 'game_over'

export interface Question {
  id: string
  term: string
  correctAnswer: string
  category: string
}

export interface AIPlayer {
  id: string
  name: string
  role: 'realupper' | 'nipper'
  explanation: string
}

export interface GameState {
  phase: GamePhase
  round: number
  maxRounds: number
  currentQuestion: Question | null
  players: AIPlayer[]
  humanVote: string | null
  score: number
  roundResult: 'correct' | 'wrong' | null
  usedQuestionIds: string[]
}
