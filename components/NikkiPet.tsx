"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { siteConfig } from '../siteConfig';
import { cloud, resolveChatModelId } from '../lib/cloud';

// 会话级对话 ID：同一段聊天里保持稳定，便于云端做路由/计量关联
const conversationId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `pet-${Date.now()}`;

/**
 * 通过 WorkBuddy 云服务（免密钥）跟暖暖对话。
 * 流式累加回复文本，返回完整的一句话；失败时抛错，由调用方兜底。
 */
async function chatWithCloud(
  history: { role: string; content: string }[],
  message: string,
): Promise<string> {
  const modelId = await resolveChatModelId();
  if (!modelId) throw new Error('no-model');

  const messages = [
    { role: 'system' as const, content: siteConfig.geminiConfig.systemPrompt },
    ...history
      .filter((h) => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
      .map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: message },
  ];

  let reply = '';
  for await (const chunk of cloud.llm.chat.completions.create({
    model: modelId,
    messages,
    stream: true,
    temperature: siteConfig.geminiConfig.temperature,
    max_tokens: siteConfig.geminiConfig.maxOutputTokens,
    conversationId,
  })) {
    const delta = chunk.choices?.[0]?.delta;
    if (delta?.content) reply += delta.content;
  }
  return reply.trim();
}

/**
 * 桌宠：暖暖 + 大喵（全动图版）
 *
 * 设计说明：
 *  - 不再使用任何静态立绘（原来的 nikki.png / momo.png 已停用），
 *    暖暖本体永远是一张正在播放的 GIF，大喵也只在动图里出现，避免「两只大喵」。
 *  - 每张 GIF 会停留 ms 毫秒后自动切下一张；ms 已调长（9~12 秒）。
 *  - 点一下暖暖 = 立刻切到下一张，并说这张图对应的台词。
 *
 * 台词规则（和 AI 人设 systemPrompt 一致，改一边记得改另一边）：
 *  1. 不叫「主人」，一律用「你」
 *  2. 每次最多一两句话，不超过 100 字
 *  3. 元气温柔，偶尔撒娇，可以带「~」
 *  4. 替大喵传话时以「喵~」结尾（大喵只会说很短的猫话）
 *  5. 聊穿搭 / 旅行 / 甜点，也会催你早点休息
 *  6. 大喵最爱五花肉🥩，你最爱番茄炒鸡蛋
 */

type GifKey = 'heart' | 'interact' | 'wave' | 'full' | 'back' | 'boat';

type GifItem = {
  src: string;
  ms: number;      // 这张图停留多久再自动切下一张
  w: number;       // 显示宽度
  label: string;   // 动作名
  lines: string[]; // 这个动作对应的台词
};

// 🎬 动图素材库（每张都带自己的台词）
// ms 已整体拉长：原来 3~4 秒，现在 9~12 秒，一张图能看完整段动作
const GIFS: Record<GifKey, GifItem> = {
  heart: {
    src: '/nikki/nikki-heart.gif', ms: 9000, w: 210, label: '拍照',
    lines: [
      '大喵今天又臭美了，我给它拍张照~',
      '别动别动，这张要拍出你的帅气喵~',
      '咔嚓！这张大喵一定很喜欢。',
      '它摆了半天 pose，就为这一张照喵~',
    ],
  },
  interact: {
    src: '/nikki/nikki-interact.gif', ms: 10000, w: 200, label: '互动',
    lines: [
      '大喵闻到五花肉的味道，直接就冲过来了喵~',
      '你带了番茄炒鸡蛋？那我要先尝一口~',
      '它吃得满嘴油光，还想要第二块。',
      '大喵说谢谢你，就是不肯松口喵~',
    ],
  },
  wave: {
    src: '/nikki/nikki-wave.gif', ms: 9500, w: 210, label: '挥手',
    lines: [
      '嗨，你来啦，我刚好在这里等你~',
      '挥挥手，今天的你也辛苦啦。',
      '刚刚还在想你，你就出现了~',
      '要不要坐下来聊两句？我正好有空。',
    ],
  },
  full: {
    src: '/nikki/nikki-full.gif', ms: 11000, w: 190, label: '全身展示',
    lines: [
      '今天这身是粉色系，转一圈给你看~',
      '裙摆会飘起来，好看吗？',
      '换了条新发带，你帮我看看搭不搭~',
      '站好给你看全身，这样显高一点吧。',
    ],
  },
  back: {
    src: '/nikki/nikki-back.gif', ms: 10000, w: 205, label: '背影',
    lines: [
      '背影也要美美的，发梢是新编的~',
      '这样站着，风会从裙角吹过来。',
      '想从背后偷袭我？我会发现的哦~',
      '看够了就叫我一声，我转回来。',
    ],
  },
  boat: {
    src: '/nikki/nikki-boat.gif', ms: 12000, w: 240, label: '划船',
    lines: [
      '我们去湖上划一会儿吧，风很软~',
      '船晃了一下，你抓紧我一点。',
      '湖面映着晚霞，像不像甜点的颜色？',
      '大喵蹲在船头一动不动地看水喵~',
    ],
  },
};

// 自动轮播顺序（点一下也会沿这个顺序往后切）
const ROTATION: GifKey[] = ['wave', 'heart', 'full', 'back', 'boat', 'interact'];

// 🐱 大喵自己的猫话（只在气泡里出声，不再有独立立绘）
const MOMO_BARKS = [
  '喵呜~ 五花肉的味道！',
  '喵……再来一块，就一块喵~',
  '喵！你的键盘借我趴一会儿喵~',
  '喵呜～肥一点的五花肉才香喵~',
  '喵？（歪头看你）',
  '喵——（满意地打了个呼噜）',
];

// 💬 暖暖的随口一句
const NIKKI_IDLE = [
  '写代码累了就抬头看看我，别一直盯着屏幕~',
  '这么晚了，你该去睡了吧？',
  '想喝点甜的吗？我猜你会选奶茶~',
  '今天有好好吃饭吗？',
  '窗外风很轻，适合出去走走。',
  '休息一下眼睛吧，我陪你发呆~',
];

// 🧠 断网 / 没配 Key 时的本地应答：按关键词挑动作 + 台词
const LOCAL_REPLIES: { keys: string[]; gif: GifKey; lines: string[] }[] = [
  {
    keys: ['累', '困', '熬夜', '加班', '烦', '难受', '哭', '撑不住'],
    gif: 'back',
    lines: [
      '辛苦啦，先放下键盘，深呼吸一下~',
      '别硬撑了，去倒杯温水，我在这儿陪你。',
      '已经很晚了，剩下的明天再弄好不好？',
    ],
  },
  {
    keys: ['穿搭', '衣服', '裙子', '好看', '发带', '怎么穿'],
    gif: 'full',
    lines: [
      '粉色配白色最稳，再加一点亮色的发带~',
      '换条裙子试试？转起来会更好看。',
      '你今天这身已经很好了，别纠结啦~',
    ],
  },
  {
    keys: ['旅行', '出去', '玩', '海', '山', '风景'],
    gif: 'boat',
    lines: [
      '去有水的地方吧，风会很软~',
      '我想坐船，你划，我负责看风景。',
      '带上大喵的话，记得多带点五花肉喵~',
    ],
  },
  {
    keys: ['吃', '饿', '饭', '甜点', '蛋糕', '奶茶', '炒鸡蛋'],
    gif: 'interact',
    lines: [
      '番茄炒鸡蛋，我能吃两碗饭~',
      '甜的也想吃，但要留一半给你。',
      '大喵已经在厨房门口守着了喵~',
    ],
  },
  {
    keys: ['代码', 'bug', '报错', '项目', '编译', '部署', '写'],
    gif: 'back',
    lines: [
      '报错先看最后一行，那里最诚实。',
      '要不要先存个档？我怕你越改越乱~',
      '写不出来就先走开五分钟，回来就通了。',
    ],
  },
  {
    keys: ['猫', '大喵', '五花肉', '肉'],
    gif: 'interact',
    lines: [
      '大喵一听到五花肉就冲过来了喵~',
      '它刚吃完，正摊在你椅子上打呼噜喵~',
      '再喂下去要抱不动了，你负责喵~',
    ],
  },
  {
    keys: ['拍照', '照片', '相机', 'pose', '臭美', '拍', '大喵美'],
    gif: 'heart',
    lines: [
      '大喵今天又臭美了，我给它拍张照~',
      '咔嚓！这张它一定很满意喵~',
      '它摆了半天 pose，就为这一张照。',
    ],
  },
  {
    keys: ['你好', '在吗', 'hi', 'hello', '嗨', '早', '晚安'],
    gif: 'wave',
    lines: [
      '在的在的，刚刚在看你~',
      '嗨~ 今天过得怎么样？',
      '晚安的话，要先闭上眼睛才算数哦。',
    ],
  },
  {
    keys: ['喜欢', '爱你', '想', '抱'],
    gif: 'full',
    lines: [
      '突然这样说，我会不知道怎么回答啦~',
      '那……我也偷偷喜欢你一点。',
      '抱一下，就一下下哦~',
    ],
  },
];

const FALLBACK_LINES = [
  '嗯……这个我还没想好，你再说一遍好不好？',
  '我听着呢，你继续~',
  '有点听不懂，但陪着你还是可以的。',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const durationOf = (text: string) => Math.min(9000, 2200 + text.length * 180);

export default function NikkiPet() {
  const [speech, setSpeech] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  // 🧠 多轮记忆：把历史对话传回去，暖暖才接得住上下文（最多保留最近 12 句）
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);

  // 当前正在播放的动图（永远是某个 GIF，不会回落到静态图）
  const [activeKey, setActiveKey] = useState<GifKey>('wave');
  const keyRef = useRef<GifKey>('wave');

  const chatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const greetedRef = useRef(false);
  const lastCallRef = useRef(0); // 上次真正打到 AI 的时间，用于限流间隔

  // --- 💬 说话 ---
  const speak = useCallback((text: string, duration?: number) => {
    setSpeech(text);
    if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
    chatTimeoutRef.current = setTimeout(() => setSpeech(null), duration ?? durationOf(text));
  }, []);

  // --- 🎬 切到指定动图（可选同时说一句）---
  const gotoGif = useCallback((key: GifKey, line?: string) => {
    keyRef.current = key;
    setActiveKey(key);
    if (line) speak(line);
  }, [speak]);

  // --- ⏭️ 切到下一张（点按 = speakIt 为 true，自动轮播 = false）---
  const nextGif = useCallback((speakIt = false) => {
    const idx = ROTATION.indexOf(keyRef.current);
    const next = ROTATION[(idx + 1) % ROTATION.length];
    gotoGif(next, speakIt ? pick(GIFS[next].lines) : undefined);
  }, [gotoGif]);

  // --- ⏱️ 每张图停留 GIFS[key].ms 后自动切下一张（点按会重开计时）---
  useEffect(() => {
    const ms = GIFS[activeKey].ms;
    const t = setTimeout(() => nextGif(false), ms);
    return () => clearTimeout(t);
  }, [activeKey, nextGif]);

  // --- 🖼️ 预加载下一张，切图时不会白屏 ---
  useEffect(() => {
    const idx = ROTATION.indexOf(activeKey);
    const next = ROTATION[(idx + 1) % ROTATION.length];
    const img = new Image();
    img.src = GIFS[next].src;
  }, [activeKey]);

  // --- 🖱️ 点暖暖：立刻切下一张 + 说这张的台词 ---
  const handlePetNikki = () => {
    nextGif(true);
  };

  // --- 🥩 喂五花肉（大喵抢答）---
  const handleFeed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isThinking) return;

    setShowInput(false);
    setIsThinking(true);
    gotoGif('interact', '五花肉！大喵眼睛都亮了喵~');

    try {
      const reply = await chatWithCloud([], '我刚刚请大喵吃了一块五花肉，也给你带了番茄炒鸡蛋，你们有什么表示？');
      speak(reply, 8000);
    } catch {
      speak('大喵吧唧吧唧吃得很香，还说下次要肥一点的喵~', 5000);
    } finally {
      setIsThinking(false);
    }
  };

  // --- 💬 发送聊天（多轮记忆，走免密钥云 LLM）---
  // 聊天时【不再切换动图】：桌宠保持当前正在播的 GIF 继续轮播，
  // 只更新头顶气泡，避免「说一句话就换一张图」看着眼花。
  const sendToNikki = async (
    payload: { message: string; history: { role: string; content: string }[] },
    tries = 2,
  ): Promise<string> => {
    for (let i = 0; i < tries; i++) {
      try {
        const reply = await chatWithCloud(payload.history, payload.message);
        if (reply) return reply;
        throw new Error('empty');
      } catch {
        if (i < tries - 1) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw new Error('network');
      }
    }
    throw new Error('retry');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setShowInput(false);
    setIsThinking(true);
    speak('让我想想哦……', 10000);
    // 只传之前的历史（不含当前这句），由后端把当前句拼到最后
    const payloadHistory = history.slice(-12);

    // 免费接口限流很严：两次请求至少隔 4 秒，避免一聊快了就撞 429
    const wait = Math.max(0, 4000 - (Date.now() - lastCallRef.current));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallRef.current = Date.now();

    try {
      const reply = await sendToNikki({ message: userMessage, history: payloadHistory });
      // 气泡停留时间随字数延长，长回答不会被秒关
      speak(reply, Math.min(16000, 3500 + reply.length * 140));
      setHistory(
        [...history, { role: 'user', content: userMessage }, { role: 'assistant', content: reply }].slice(-12),
      );
    } catch {
      // 断网 / 云服务连不上：走本地关键词应答，只说话、不切图
      const hit = LOCAL_REPLIES.find((r) => r.keys.some((k) => userMessage.includes(k)));
      if (hit) {
        speak(pick(hit.lines));
      } else {
        speak(pick(FALLBACK_LINES));
      }
    } finally {
      setIsThinking(false);
    }
  };

  // --- 👋 进来先打个招呼（只打一次）---
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const t = setTimeout(() => gotoGif('wave', '嗨，你终于来了~'), 1500);
    return () => clearTimeout(t);
  }, [gotoGif]);

  // --- ⏳ 挂机：隔一会儿让大喵插一句，或暖暖随口说一句（图照常轮播）---
  useEffect(() => {
    idleTimerRef.current = setInterval(() => {
      if (speech || showInput || isThinking) return;
      if (Math.random() > 0.5) {
        speak(pick(MOMO_BARKS), 4000);
      } else {
        speak(pick(NIKKI_IDLE));
      }
    }, 17000);

    return () => { if (idleTimerRef.current) clearInterval(idleTimerRef.current); };
  }, [speech, showInput, isThinking, speak]);

  useEffect(() => {
    return () => {
      if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, []);

  const current = GIFS[activeKey];
  const nextLabel = GIFS[ROTATION[(ROTATION.indexOf(activeKey) + 1) % ROTATION.length]].label;

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
      className="fixed bottom-20 right-20 z-[9999] flex flex-col items-center group cursor-grab active:cursor-grabbing"
    >
      {/* 💬 聊天气泡 */}
      <div className="relative w-full flex justify-center mb-4">
        <AnimatePresence>
          {speech && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="absolute bottom-0 bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-200 px-4 py-3 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 text-sm max-w-[260px] break-words leading-relaxed"
              style={{ pointerEvents: 'none', transformOrigin: 'bottom center' }}
            >
              <div className="flex items-start gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/nikki/nikki-avatar.png" alt="暖暖" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
                <span>{speech}</span>
              </div>
              <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-b border-r border-gray-100 dark:border-slate-700 transform rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 👧 暖暖（永远是一张正在播的动图） */}
      <div className="relative">
        {/* 左侧常驻按钮 */}
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); setShowInput(!showInput); }}
            className="bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 text-pink-500 hover:text-pink-600 flex items-center justify-center backdrop-blur-sm"
            title="和暖暖聊天"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={handleFeed}
            disabled={isThinking}
            className={`bg-white/90 dark:bg-slate-700/90 p-2.5 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border border-gray-100 dark:border-slate-600 flex items-center justify-center backdrop-blur-sm ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="喂大喵一块五花肉"
          >
            <span className="text-xl leading-none">🥩</span>
          </button>
        </div>

        <div
          className="cursor-pointer transition-[width] duration-300"
          style={{ width: current.w }}
          onClick={handlePetNikki}
          title={`点我切换：下一张是「${nextLabel}」`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt="暖暖"
            className="w-full h-auto drop-shadow-2xl select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* ⌨️ 互动输入框 */}
      <AnimatePresence>
        {showInput && (
          <motion.form
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            onSubmit={handleChatSubmit}
            className="absolute -bottom-14 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg flex items-center border border-gray-200 dark:border-slate-700 w-56 z-20"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="跟暖暖说点啥~"
              className="bg-transparent border-none outline-none text-sm px-3 py-1 w-full dark:text-white placeholder-gray-400"
              disabled={isThinking}
              autoFocus
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim()}
              className={`rounded-full p-1.5 ml-1 flex items-center justify-center transition-colors ${isThinking || !inputValue.trim() ? 'bg-gray-300 text-gray-500' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
