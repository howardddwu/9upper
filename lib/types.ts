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
  difficulty: 1 | 2 | 3
  hints: [string, string, string]
}

export interface AIPlayer {
  id: string
  name: string
  role: 'realupper' | 'nipper'
  explanation: string
}

export interface GameState {
  phase: GamePhase
  currentQuestion: Question | null
  players: AIPlayer[]
  humanVote: string | null
  roundResult: 'correct' | 'wrong' | null
  usedQuestionIds: string[]
}
