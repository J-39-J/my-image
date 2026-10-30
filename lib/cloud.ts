// lib/cloud.ts — WorkBuddy 云服务客户端（免密钥 AI 对话）
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';

// 云服务公开配置：由「开通云服务」返回的 publicConfig。
// 这些都是公开配置（可安全打包进前端），不含任何密钥或服务端凭据。
const publicConfig = {
  endpoint: 'https://jhj-blog.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_0qtry0exD4IDBI2AuihQ6R_3ZDo2OOdGtIxkDTSQwQt7Fj7vFrjld8r',
};

export const cloud = createWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
  publishableKey: publicConfig.publishableKey,
});

// 模型目录只查一次，之后缓存
let cachedModelId: string | null = null;

/**
 * 选一个可用的对话模型 id。
 * 桌宠要「秒回短句」，所以优先选非思考型（非 onlyReasoning）模型；
 * 都没有就退回目录标记的默认模型 / 第一个可用模型。
 */
export async function resolveChatModelId(): Promise<string | null> {
  if (cachedModelId) return cachedModelId;
  try {
    const models = await cloud.llm.models.list();
    const enabled = models.filter((m) => m.disabled !== true && m.enabled !== false);
    if (enabled.length === 0) return null;
    const fast = enabled.find((m) => m.onlyReasoning !== true);
    const pick = fast || enabled.find((m) => m.isDefault === true) || enabled[0];
    cachedModelId = pick.id;
    return cachedModelId;
  } catch {
    return null;
  }
}
