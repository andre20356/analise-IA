import crypto from "crypto";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to decrypt keys used in server.ts
function decryptKey(text: string, secretSalt: string): string {
  if (!text) return "";
  if (!text.includes(":")) return text;
  try {
    const ENCRYPTION_KEY = crypto.scryptSync(secretSalt, "trading_assistant_salt", 32);
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return "";
  }
}

// Fetch helper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (err: any) {
    throw err;
  } finally {
    clearTimeout(id);
  }
}

// Generate authentication headers for Bybit V5
function getBybitHeaders(apiKey: string, secretKey: string, queryString: string, bodyString = "") {
  const timestamp = Date.now().toString();
  const recvWindow = "5000";
  const signPayload = timestamp + apiKey + recvWindow + queryString + bodyString;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signPayload)
    .digest("hex");

  return {
    "X-BAPI-API-KEY": apiKey,
    "X-BAPI-RECV-WINDOW": recvWindow,
    "X-BAPI-SIGN": signature,
    "X-BAPI-TIMESTAMP": timestamp,
    "Content-Type": "application/json"
  };
}

// Helper to retrieve keys from db.json
export function getSavedCredentials() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const state = JSON.parse(raw);
      if (state && state.config) {
        const secretSalt = process.env.GEMINI_API_KEY || "AI_TRADING_DEFAULT_SALT_123";
        const apiKey = state.config.apiKey ? decryptKey(state.config.apiKey, secretSalt) : "";
        const secretKey = state.config.secretKey ? decryptKey(state.config.secretKey, secretSalt) : "";
        return { apiKey, secretKey, config: state.config };
      }
    }
  } catch (err: any) {
    console.error("[ExchangeService] Error reading credentials:", err.message);
  }
  return { apiKey: "", secretKey: "", config: null };
}

export class ExchangeService {
  /**
   * Fetches the actual wallet balance.
   * If USE_REAL_EXCHANGE is false or call fails, falls back to the virtual balance in DB.
   */
  static async fetchBalance(): Promise<{ balance: number; currency: string; isReal: boolean }> {
    const isRealExchange = process.env.USE_REAL_EXCHANGE === "true";
    const { apiKey, secretKey, config } = getSavedCredentials();
    const fallbackBalance = config?.currentBalance ?? 1000.0;

    if (!isRealExchange) {
      return { balance: fallbackBalance, currency: "USDT", isReal: false };
    }

    if (!apiKey || !secretKey) {
      console.warn("[ExchangeService] API Keys are missing. Using mock balance fallback.");
      return { balance: fallbackBalance, currency: "USDT", isReal: false };
    }

    try {
      const queryString = "accountType=UNIFIED";
      const headers = getBybitHeaders(apiKey, secretKey, queryString);
      const res = await fetchWithTimeout(`https://api.bybit.com/v5/account/wallet-balance?${queryString}`, {
        method: "GET",
        headers
      });

      if (!res.ok) {
        throw new Error(`Bybit HTTP error: ${res.status}`);
      }

      const data: any = await res.json();
      if (data.retCode !== 0) {
        throw new Error(data.retMsg || "Bybit API returned non-zero retCode");
      }

      const list = data.result?.list || [];
      if (list.length > 0) {
        const totalWalletBalance = parseFloat(list[0].totalWalletBalance || "0");
        const totalEquity = parseFloat(list[0].totalEquity || "0");
        return {
          balance: totalEquity > 0 ? totalEquity : (totalWalletBalance > 0 ? totalWalletBalance : fallbackBalance),
          currency: "USDT",
          isReal: true
        };
      }
    } catch (err: any) {
      console.error("[ExchangeService] fetchBalance error, falling back to mock:", err.message);
    }

    return { balance: fallbackBalance, currency: "USDT", isReal: false };
  }

  /**
   * Fetches assets/coin holdings inside the unified account.
   * Falls back to mock values representing BTC, ETH, SOL, XRP, DOGE allocations.
   */
  static async fetchAssets(): Promise<{ coin: string; balance: number; valueUsd: number; isReal: boolean }[]> {
    const isRealExchange = process.env.USE_REAL_EXCHANGE === "true";
    const { apiKey, secretKey, config } = getSavedCredentials();
    
    const mockAssets = [
      { coin: "USDT", balance: config?.currentBalance ?? 1000.0, valueUsd: config?.currentBalance ?? 1000.0, isReal: false },
      { coin: "BTC", balance: 0.05, valueUsd: 3350, isReal: false },
      { coin: "ETH", balance: 0.45, valueUsd: 1530, isReal: false },
      { coin: "SOL", balance: 12.5, valueUsd: 1875, isReal: false }
    ];

    if (!isRealExchange) {
      return mockAssets;
    }

    if (!apiKey || !secretKey) {
      console.warn("[ExchangeService] API Keys are missing. Using mock assets fallback.");
      return mockAssets;
    }

    try {
      const queryString = "accountType=UNIFIED";
      const headers = getBybitHeaders(apiKey, secretKey, queryString);
      const res = await fetchWithTimeout(`https://api.bybit.com/v5/account/wallet-balance?${queryString}`, {
        method: "GET",
        headers
      });

      if (!res.ok) {
        throw new Error(`Bybit HTTP error: ${res.status}`);
      }

      const data: any = await res.json();
      if (data.retCode !== 0) {
        throw new Error(data.retMsg || "Bybit API error");
      }

      const coins = data.result?.list?.[0]?.coin || [];
      if (coins.length > 0) {
        return coins.map((c: any) => ({
          coin: c.coin,
          balance: parseFloat(c.walletBalance || "0"),
          valueUsd: parseFloat(c.usdValue || "0"),
          isReal: true
        }));
      }
    } catch (err: any) {
      console.error("[ExchangeService] fetchAssets error, falling back to mock:", err.message);
    }

    return mockAssets;
  }

  /**
   * Fetches active positions for USDT perpetual contracts.
   * Falls back to open virtual trades from db.json.
   */
  static async fetchPositions(): Promise<{
    id: string;
    asset: string;
    type: "COMPRA" | "VENDA";
    entryPrice: number;
    currentPrice: number;
    size: number;
    unrealizedPnl: number;
    unrealizedPnlPct: number;
    investedCapital: number;
    stopLoss: number;
    takeProfit: number;
    isReal: boolean;
  }[]> {
    const isRealExchange = process.env.USE_REAL_EXCHANGE === "true";
    const { apiKey, secretKey } = getSavedCredentials();

    // Default mock fallback: read from state.trades
    let mockPositions: any[] = [];
    try {
      if (fs.existsSync(DB_FILE)) {
        const state = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        if (state && Array.isArray(state.trades)) {
          mockPositions = state.trades
            .filter((t: any) => t.status === "OPEN")
            .map((t: any) => ({
              id: t.id,
              asset: t.asset,
              type: t.type,
              entryPrice: t.entryPrice,
              currentPrice: t.entryPrice, // Will be updated by pricing, or fallback
              size: t.investedCapital / t.entryPrice,
              unrealizedPnl: t.profitCapital || 0,
              unrealizedPnlPct: t.profitPct || 0,
              investedCapital: t.investedCapital,
              stopLoss: t.stopLoss,
              takeProfit: t.takeProfit,
              isReal: false
            }));
        }
      }
    } catch (e: any) {
      console.error("[ExchangeService] Error forming mock positions fallback:", e.message);
    }

    if (!isRealExchange) {
      return mockPositions;
    }

    if (!apiKey || !secretKey) {
      console.warn("[ExchangeService] API Keys are missing. Using mock positions fallback.");
      return mockPositions;
    }

    try {
      const queryString = "category=linear&settleCoin=USDT";
      const headers = getBybitHeaders(apiKey, secretKey, queryString);
      const res = await fetchWithTimeout(`https://api.bybit.com/v5/position/list?${queryString}`, {
        method: "GET",
        headers
      });

      if (!res.ok) {
        throw new Error(`Bybit HTTP error: ${res.status}`);
      }

      const data: any = await res.json();
      if (data.retCode !== 0) {
        throw new Error(data.retMsg || "Bybit API error");
      }

      const list = data.result?.list || [];
      const positions = list
        .filter((pos: any) => parseFloat(pos.size) > 0)
        .map((pos: any, idx: number) => {
          const entryPrice = parseFloat(pos.avgPrice || pos.entryPrice || "0");
          const markPrice = parseFloat(pos.markPrice || "0");
          const size = parseFloat(pos.size || "0");
          const side = pos.side === "Buy" ? "COMPRA" : "VENDA";
          const unrealizedPnl = parseFloat(pos.unrealisedPnl || "0");
          const positionValue = parseFloat(pos.positionValue || "0");
          
          let unrealizedPnlPct = 0;
          if (entryPrice > 0) {
            unrealizedPnlPct = side === "COMPRA" 
              ? ((markPrice - entryPrice) / entryPrice) * 100 
              : ((entryPrice - markPrice) / entryPrice) * 100;
          }

          const sl = parseFloat(pos.stopLoss || "0");
          const tp = parseFloat(pos.takeProfit || "0");

          // Format asset name back from Bybit ("BTCUSDT" -> "BTC/USDT")
          let asset = pos.symbol;
          if (asset.endsWith("USDT")) {
            asset = asset.slice(0, -4) + "/USDT";
          }

          return {
            id: `real-pos-${pos.symbol}-${idx}`,
            asset: asset,
            type: side as "COMPRA" | "VENDA",
            entryPrice: entryPrice,
            currentPrice: markPrice,
            size: size,
            unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2)),
            unrealizedPnlPct: parseFloat(unrealizedPnlPct.toFixed(2)),
            investedCapital: parseFloat(positionValue.toFixed(2)),
            stopLoss: sl,
            takeProfit: tp,
            isReal: true
          };
        });

      // Filter out empty arrays or fallback if empty
      if (positions.length > 0) {
        return positions;
      }
    } catch (err: any) {
      console.error("[ExchangeService] fetchPositions error, falling back to mock:", err.message);
    }

    return mockPositions;
  }
}
