# 9UPPER · 瞎掰王

> 每个人都在说话，但谁在说真话？

一款多人桌游网页应用，玩家分配角色互相欺骗，找出谁是老实人、谁在瞎掰。

🔗 **线上游玩：[9upper-iota.vercel.app](https://9upper-iota.vercel.app)**

---

## 游戏玩法

玩家自行分配三种角色：

| 角色 | 说明 |
|------|------|
| 🤔 **想想** | 目标是找出老实人 |
| ✅ **老实人** | 说真话，但别说太明显 |
| 😈 **瞎掰人** | 一本正经地胡说八道 |

**游戏流程：**

1. 玩家自行分配角色（想想 ×1、老实人 ×1、其余皆为瞎掰人）
2. 翻开题目卡，网站语音引导每个环节
3. 老实人点开谜底偷看，其他人准备瞎掰
4. 所有玩家轮流解释这个词汇的意思
5. 想想说出答案后，揭晓谜底确认结果
6. 猜对得 2 分，想玩多久就玩多久！

目前支持**自助模式**（玩家自行分配角色，网站担任语音主持，引导每个环节），多人联机模式敬请期待。

---

## 题库

内置 200 道涵盖心理学、哲学、科学、历史、经济学等领域的词汇题目，每题附有三个方向性提示。

---

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

---

## 技术栈

- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel](https://vercel.com) 部署
- [Vercel Analytics](https://vercel.com/analytics)

---

© 2026 Made by [@howardddwu](https://github.com/howardddwu)
