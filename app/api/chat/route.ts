// app/api/chat/route.ts
// 支持多家模型：Google Gemini / 任何 OpenAI 兼容接口（DeepSeek、通义、智谱、Moonshot、硅基流动…）
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

// 🌐 内置预设：填 AI_PROVIDER=deepseek 之类的名字即可，省得手写地址
const PRESETS: Record<string, { base: string; model: string }> = {
  // 本地 Ollama：不用注册、不用联网、完全免费（只是占一点内存）
  ollama:      { base: 'http://127.0.0.1:11434/v1',                          model: 'qwen2.5:7b' },
  deepseek:    { base: 'https://api.deepseek.com/v1',                        model: 'deepseek-flash' },
  siliconflow: { base: 'https://api.siliconflow.cn/v1',                      model: 'Qwen/Qwen2.5-7B-Instruct' },
  // 智谱：glm-4.7-flash 是官方「输入/输出/缓存全免费」的模型，个人用不要钱
  zhipu:       { base: 'https://open.bigmodel.cn/api/paas/v4',               model: 'glm-4.7-flash' },
  moonshot:    { base: 'https://api.moonshot.cn/v1',                         model: 'moonshot-v1-8k' },
  qwen:        { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1',  model: 'qwen-plus' },
  openai:      { base: 'https://api.openai.com/v1',                          model: 'gpt-4o-mini' },
};

const env = (k: string) => (process.env[k] || '').trim();
const looksLikeKey = (k: string) => /^[A-Za-z0-9_\-\.]{16,}$/.test(k);

/** 去哪领 Key（自检页直接给链接，省得翻文档） */
const KEY_URLS: Record<string, string> = {
  zhipu: 'https://open.bigmodel.cn/usercenter/apikeys（GLM-4.7-Flash 输入/输出全免费）',
  deepseek: 'https://platform.deepseek.com/api_keys',
  siliconflow: 'https://cloud.siliconflow.cn/account/ak',
  moonshot: 'https://platform.moonshot.cn/console/api-keys',
  qwen: 'https://dashscope.console.aliyun.com/apiKey',
  openai: 'https://platform.openai.com/api-keys',
};

/** 组装 OpenAI 兼容接口的请求体 */
function buildChatBody(cfg: any, systemPrompt: string, message: string, maxTokens: number, temperature: number, history: { role: string; content: string }[] = []) {
  const body: Record<string, any> = {
    model: cfg.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((h) => (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
        .map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ],
    max_tokens: maxTokens,
    temperature,
  };
  // 智谱 GLM-4.7-Flash 是「混合思考模型」，默认会先自言自语想一大段才回答。
  // 桌宠要的是秒回的短句，所以关掉思考；想看它推理过程就设 AI_THINKING=on
  if (cfg.provider === 'zhipu' && env('AI_THINKING') !== 'on') {
    body.thinking = { type: 'disabled' };
  }
  return body;
}

/** 判断当前应该走哪条通道 */
function resolveProvider() {
  const provider = (env('AI_PROVIDER') || '').toLowerCase();

  // 0) 本地 Ollama 通道：不需要真 Key，随便填个 ollama 就行
  if (provider === 'ollama' || provider === 'local') {
    const base = (env('AI_BASE_URL') || PRESETS.ollama.base).replace(/\/+$/, '');
    return {
      kind: 'openai' as const,
      key: env('AI_API_KEY') || 'ollama',
      base,
      model: env('AI_MODEL') || PRESETS.ollama.model,
      provider: 'ollama',
    };
  }

  // 1) OpenAI 兼容通道：给了 AI_API_KEY（或兼容 Key）就优先走它
  const compatKey = env('AI_API_KEY') || env('DEEPSEEK_API_KEY') || env('OPENAI_API_KEY');
  if (provider !== 'gemini' && looksLikeKey(compatKey)) {
    const preset = PRESETS[provider] || { base: env('AI_BASE_URL'), model: env('AI_MODEL') };
    const base = (preset.base || env('AI_BASE_URL') || '').replace(/\/+$/, '');
    const model = env('AI_MODEL') || preset.model || siteConfig.geminiConfig.modelId;
    return { kind: 'openai' as const, key: compatKey, base, model, provider: provider || 'custom' };
  }

  // 1.5) 选了内置服务商但 Key 还没填：也要如实报出通道名，方便自检页提示去哪领 Key
  if (provider && provider !== 'gemini' && PRESETS[provider]) {
    const preset = PRESETS[provider];
    return {
      kind: 'openai' as const,
      key: compatKey || '',
      base: (env('AI_BASE_URL') || preset.base).replace(/\/+$/, ''),
      model: env('AI_MODEL') || preset.model,
      provider,
    };
  }

  // 2) 否则退回 Google Gemini
  return {
    kind: 'gemini' as const,
    key: env('GEMINI_API_KEY'),
    base: '',
    model: env('AI_MODEL') || siteConfig.geminiConfig.modelId,
    provider: 'gemini',
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body.message || '').toString();
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const history = rawHistory
      .filter((h: any) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
      .slice(-12);
    const cfg = resolveProvider();

    if (!looksLikeKey(cfg.key)) {
      console.error("❌ AI Key 没配好，当前通道:", cfg.provider);
      return new Response(JSON.stringify({
        error: "Key missing",
        hint: "在 XHBlogs/.env.local 里配置 AI_PROVIDER / AI_API_KEY（或 GEMINI_API_KEY），保存后重启 bash start-mac.sh"
      }), { status: 500 });
    }

    if (cfg.kind === 'openai' && !cfg.base) {
      return new Response(JSON.stringify({
        error: "Base URL missing",
        hint: "用自定义服务商时要同时给 AI_BASE_URL，或者直接用内置名：deepseek / qwen / zhipu / moonshot / siliconflow / openai"
      }), { status: 500 });
    }

    const systemPrompt = siteConfig.geminiConfig.systemPrompt;
    const maxTokens = siteConfig.geminiConfig.maxOutputTokens;
    const temperature = siteConfig.geminiConfig.temperature;

    let reply = "";

    if (cfg.kind === 'gemini') {
      // ---------- Google Gemini 原生接口 ----------
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...history.map((h) => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
            { role: 'user', parts: [{ text: message }] },
          ],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("🚨 Gemini 拒绝请求:", JSON.stringify(data));
        return new Response(JSON.stringify({
          error: `模型拒绝访问: ${res.status}`,
          details: data.error?.message || "未知错误"
        }), { status: res.status });
      }
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "本喵现在不想理你喵...";
    } else {
      // ---------- OpenAI 兼容接口（DeepSeek / 通义 / 智谱 / Moonshot / 硅基流动 …）----------
      const res = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.key}`,
        },
        body: JSON.stringify(buildChatBody(cfg, systemPrompt, message, maxTokens, temperature, history))
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("🚨 模型拒绝请求:", JSON.stringify(data));
        return new Response(JSON.stringify({
          error: `模型拒绝访问: ${res.status}`,
          details: data.error?.message || data.msg || "未知错误"
        }), { status: res.status });
      }
      // 有些思考型模型只回 reasoning_content，兜一下底
      reply = data.choices?.[0]?.message?.content
           || data.choices?.[0]?.message?.reasoning_content
           || data.choices?.[0]?.text
           || "……（对方没说话）";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("🔥 运行时崩溃:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

// 🩺 自检接口：浏览器直接打开 http://localhost:3000/api/chat 就能看配没配好
export async function GET() {
  const cfg = resolveProvider();
  const isLocal = cfg.provider === 'ollama';
  const ok = isLocal ? Boolean(cfg.base) : looksLikeKey(cfg.key) && (cfg.kind === 'gemini' || Boolean(cfg.base));
  return new Response(JSON.stringify({
    status: "Ready",
    provider: cfg.provider,
    channel: cfg.kind === 'gemini' ? 'Google Gemini' : (isLocal ? '本机 Ollama（免费）' : 'OpenAI 兼容接口'),
    base: cfg.base || null,
    model: cfg.model,
    keyConfigured: ok,
    keyMask: cfg.key ? `${cfg.key.slice(0, 4)}****${cfg.key.slice(-4)}` : null,
    hint: ok
      ? (isLocal
          ? "走的是本机 Ollama，免费。确认已 ollama serve 且拉过模型：ollama pull " + cfg.model
          : "已经接上了，去页面上跟暖暖说话吧~")
      : "还没配好：在 XHBlogs/.env.local 里写 AI_PROVIDER=" + (cfg.provider || '服务商')
        + " + AI_API_KEY=你的Key，保存后重启 bash start-mac.sh",
    keyUrl: ok ? null : (KEY_URLS[cfg.provider] || null),
    cost: cfg.provider === 'zhipu' ? 'free（GLM-4.7-Flash 输入/输出/缓存均 0 元）'
        : cfg.provider === 'ollama' ? 'free（本机推理）' : null,
    presets: Object.keys(PRESETS),
  }, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
