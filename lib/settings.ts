export type GameMode = 'self' | 'online'
export type UILang = 'zh-TW' | 'zh-CN'
export type VoiceLang = 'zh-TW' | 'zh-CN' | 'zh-HK'

export interface AppSettings {
  mode: GameMode
  uiLang: UILang
  voiceLang: VoiceLang
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'self',
  uiLang: 'zh-TW',
  voiceLang: 'zh-TW',
}

const STORAGE_KEY = '9upper-settings'

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: AppSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}
