/**
 * Evolution API WhatsApp Integration
 * Módulo de mensageria com suporte a fallback inteligente do 9º dígito brasileiro
 * e formato compatível com v1 e v2 da Evolution API.
 */

export interface EvolutionSendResult {
  success: boolean;
  phone: string;
  statusCode?: number;
  error?: string;
  responsePayload?: any;
}

export interface EvolutionConfig {
  baseUrl: string;
  apiKey?: string;
  instance: string;
}

export function getEvolutionConfig(): EvolutionConfig {
  return {
    baseUrl: (process.env.EVOLUTION_API_URL || 'https://evolutionapi.vps6663.panel.icontainer.run').replace(/\/+$/, ''),
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instance: (process.env.EVOLUTION_INSTANCE || 'personal-tasks').trim(),
  };
}

/**
 * Normaliza número de telefone brasileiro e gera variantes para fallback do 9º dígito
 */
export function generatePhoneVariants(rawInput: string): string[] {
  let clean = rawInput.replace(/\D/g, '');
  if (!clean) return [];

  // Se não começa com 55 e tem 10 ou 11 dígitos, adiciona DDI do Brasil
  if (!clean.startsWith('55') && (clean.length === 10 || clean.length === 11)) {
    clean = `55${clean}`;
  }

  const variants: string[] = [clean];

  // Caso brasileiro (DDI 55)
  if (clean.startsWith('55')) {
    // Ex: 55 11 987654321 (13 dígitos: 55 + DDD de 2 + 9 dígitos de celular)
    if (clean.length === 13 && clean[4] === '9') {
      const without9 = clean.slice(0, 4) + clean.slice(5); // 12 dígitos
      variants.push(without9);
    }
    // Ex: 55 11 87654321 (12 dígitos: sem o nono dígito)
    else if (clean.length === 12) {
      const with9 = clean.slice(0, 4) + '9' + clean.slice(4); // 13 dígitos
      variants.push(with9);
    }
  }

  return Array.from(new Set(variants));
}

/**
 * Envia mensagem de texto via Evolution API com fallback do 9º dígito e tolerância a falhas
 */
export async function sendEvolutionWhatsApp(
  targetPhone: string,
  textMessage: string,
  customConfig?: Partial<EvolutionConfig>
): Promise<EvolutionSendResult> {
  const cfg = { ...getEvolutionConfig(), ...customConfig };

  if (!cfg.baseUrl) {
    return {
      success: false,
      phone: targetPhone,
      error: 'URL da Evolution API não está configurada no ambiente.',
    };
  }

  const phoneVariants = generatePhoneVariants(targetPhone);
  if (phoneVariants.length === 0) {
    return {
      success: false,
      phone: targetPhone,
      error: 'Número de telefone inválido.',
    };
  }

  // Monta endpoint Evolution API: /message/sendText/{instance}
  let endpoint = cfg.baseUrl;
  if (!endpoint.includes('/message/sendText')) {
    endpoint = `${endpoint}/message/sendText/${encodeURIComponent(cfg.instance)}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg.apiKey) {
    headers['apikey'] = cfg.apiKey;
  }

  let lastError = '';
  let lastStatus = 0;

  for (const phone of phoneVariants) {
    const masked = phone.length > 7 ? `${phone.slice(0, 4)}****${phone.slice(-4)}` : '***';
    console.log(`[Evolution WhatsApp] Tentando envio de mensagem para ${masked}...`);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          number: phone,
          text: textMessage,
        }),
      });

      lastStatus = res.status;
      const resText = await res.text();

      if (res.ok) {
        console.log(`[Evolution WhatsApp] ✅ Mensagem entregue com sucesso para ${masked}!`);
        return {
          success: true,
          phone,
          statusCode: res.status,
          responsePayload: safeJsonParse(resText),
        };
      }

      console.warn(`[Evolution WhatsApp] ⚠️ Falha no envio para ${masked} (HTTP ${res.status}): ${resText.slice(0, 150)}`);
      lastError = resText;

      // Se a Evolution retornou que o número não possui WhatsApp, tenta a variante
      if (resText.includes('exists') && resText.includes('false')) {
        continue;
      }
    } catch (err: any) {
      console.error(`[Evolution WhatsApp] ❌ Erro de rede ao conectar à Evolution API:`, err?.message || err);
      lastError = err?.message || 'Falha de conexão de rede';
    }
  }

  return {
    success: false,
    phone: targetPhone,
    statusCode: lastStatus,
    error: lastError || 'Não foi possível entregar a mensagem após tentar as variações do número.',
  };
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
