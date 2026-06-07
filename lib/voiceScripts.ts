import { VoiceLang } from './settings'

type Scripts = {
  startRound: (term: string) => string
  goExplaining: (term: string) => string
  goVoting: () => string
  revealAnswer: () => string
  resultCorrect: () => string
  resultWrong: () => string
  nextRound: () => string
  gameOver: () => string
}

const mandarin_TW: Scripts = {
  startRound: (term) =>
    `翻牌！題目是「${term}」。想想請閉上眼睛。老實人，請偷偷點開謎底，記住正確答案。`,
  goExplaining: (term) =>
    `好，天亮了！現在每位玩家，包括老實人和瞎掰人，輪流對「${term}」給出你的解釋。老實人請說真話，瞎掰人請發揮創意！想想，請仔細聆聽！`,
  goVoting: () =>
    `說明結束！想想，根據大家的解釋，你認為誰是老實人？說出你的答案，準備好後揭曉謎底！`,
  revealAnswer: () => `謎底揭曉！看看想想猜對了嗎？`,
  resultCorrect: () => `恭喜！想想猜對了！`,
  resultWrong: () => `哎！想想被瞎掰人騙了！`,
  nextRound: () => `準備好了嗎？翻開下一張題目卡！`,
  gameOver: () =>
    `所有題目都玩完了！感謝大家參與瞎掰王！`,
}

const mandarin_CN: Scripts = {
  startRound: (term) =>
    `翻牌！题目是「${term}」。想想请闭上眼睛。老实人，请偷偷点开谜底，记住正确答案。`,
  goExplaining: (term) =>
    `好，天亮了！现在每位玩家，包括老实人和瞎掰人，轮流对「${term}」给出你的解释。老实人请说真话，瞎掰人请发挥创意！想想，请仔细聆听！`,
  goVoting: () =>
    `说明结束！想想，根据大家的解释，你认为谁是老实人？说出你的答案，准备好后揭晓谜底！`,
  revealAnswer: () => `谜底揭晓！看看想想猜对了吗？`,
  resultCorrect: () => `恭喜！想想猜对了！`,
  resultWrong: () => `哎！想想被瞎掰人骗了！`,
  nextRound: () => `准备好了吗？翻开下一张题目卡！`,
  gameOver: () =>
    `所有题目都玩完了！感谢大家参与瞎掰王！`,
}

// Cantonese (粵語) — zh-HK
const cantonese: Scripts = {
  startRound: (term) =>
    `開牌！今次嘅題目係「${term}」。諗樣請閉埋眼。老實人，請偷睇謎底，記住答案。`,
  goExplaining: (term) =>
    `好，天光喇！而家每位玩家，包括老實人同瞎掰人，輪流解釋「${term}」係咩意思。老實人講真話，瞎掰人盡情發揮！諗樣，請仔細聽！`,
  goVoting: () =>
    `解釋完喇！諗樣，根據大家嘅解釋，你覺得邊個係老實人？講出你嘅答案，準備好就揭曉謎底！`,
  revealAnswer: () => `謎底揭曉！睇睇諗樣估啱未？`,
  resultCorrect: () => `恭喜！諗樣估啱喇！`,
  resultWrong: () => `哎！諗樣畀瞎掰人呃咗！`,
  nextRound: () => `準備好未？翻開下一張題目卡！`,
  gameOver: () =>
    `所有題目都玩完喇！多謝大家參與瞎掰王！`,
}

export function getVoiceScripts(lang: VoiceLang): Scripts {
  switch (lang) {
    case 'zh-CN': return mandarin_CN
    case 'zh-HK': return cantonese
    default: return mandarin_TW
  }
}
