import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg-deep)' }}>
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="text-center">
          <div className="text-xs font-semibold tracking-[0.3em] mb-2" style={{ color: 'var(--color-primary)' }}>
            9UPPER
          </div>
          <h1 className="text-6xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            瞎掰王
          </h1>
          <p className="mt-3 text-base" style={{ color: 'var(--color-muted)' }}>
            每個人都在說話，但誰在說真話？
          </p>
        </div>

        {/* Role Cards */}
        <div className="w-full grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 flex flex-col items-center gap-2 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-3xl">🤔</div>
            <div className="text-xs font-bold" style={{ color: 'var(--color-guesser)' }}>想想</div>
            <div className="text-xs text-center leading-4" style={{ color: 'var(--color-muted)' }}>找出老實人</div>
          </div>
          <div className="rounded-2xl p-4 flex flex-col items-center gap-2 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-3xl">✅</div>
            <div className="text-xs font-bold" style={{ color: 'var(--color-realupper)' }}>老實人</div>
            <div className="text-xs text-center leading-4" style={{ color: 'var(--color-muted)' }}>說真話，但別太明顯</div>
          </div>
          <div className="rounded-2xl p-4 flex flex-col items-center gap-2 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
            <div className="text-3xl">😈</div>
            <div className="text-xs font-bold" style={{ color: 'var(--color-nipper)' }}>瞎掰人</div>
            <div className="text-xs text-center leading-4" style={{ color: 'var(--color-muted)' }}>一本正經胡說八道</div>
          </div>
        </div>

        {/* How to play */}
        <div className="w-full rounded-2xl p-5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--color-border)' }}>
          <h2 className="font-bold mb-3 text-sm" style={{ color: 'var(--color-primary)' }}>遊戲方式</h2>
          <ol className="space-y-2">
            {[
              '你是「想想」，負責找出說真話的老實人',
              '翻開題目卡，上面有個冷知識詞彙',
              '四位 AI 玩家輪流說出對這個詞彙的解釋',
              '其中一位說的是真話，三位在胡說八道',
              '聽完後，投票選出你認為的老實人',
              '猜對得 2 分，共 5 回合，看看你能得幾分！',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'var(--color-primary)', color: '#0f0e17' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Start Button */}
        <Link
          href="/game"
          className="w-full py-4 rounded-2xl text-center font-black text-lg transition-all active:scale-95"
          style={{ background: 'var(--color-primary)', color: '#0f0e17' }}
        >
          開始遊戲
        </Link>

        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          共 5 回合 · 由 AI 扮演其他玩家
        </p>
      </div>
    </div>
  )
}
