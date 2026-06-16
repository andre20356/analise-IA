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

// Helper to retrieve keys prioritizing environment variables, falling back to db.json
export function getSavedCredentials() {
  // Check ENVIRONMENT variables first for security
  const envApiKey = process.env.BYBIT_API_KEY || process.env.BINANCE_API_KEY || process.env.API_KEY || "";
  const envSecretKey = process.env.BYBIT_API_SECRET || process.env.BYBIT_SECRET_KEY || process.env.BINANCE_API_SECRET || process.env.BINANCE_API_SECRET_KEY || process.env.SECRET_KEY || process.env.API_SECRET || "";

  let dbConfig: any = null;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const state = JSON.parse(raw);
      if (state && state.config) {
        dbConfig = state.config;
      }
    }
  } catch (err) {}

  if (envApiKey && envSecretKey) {
    return { apiKey: envApiKey, secretKey: envSecretKey, config: dbConfig };
  }

  // Fallback to saved database credentials if environment variables aren't set
  try {
    if (dbConfig) {
      const secretSalt = process.env.GEMINI_API_KEY || "AI_TRADING_DEFAULT_SALT_123";
      const apiKey = dbConfig.apiKey ? decryptKey(dbConfig.apiKey, secretSalt) : "";
      const secretKey = dbConfig.secretKey ? decryptKey(dbConfig.secretKey, secretSalt) : "";
      return { apiKey, secretKey, config: dbConfig };
    }
  } catch (err: any) {
    console.error("[ExchangeService] Error reading credentials from DB fallback:", err.message);
  }

  return { apiKey: "", secretKey: "", config: dbConfig };
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

  /**
   * Fetches ticker/price data for a symbol.
   * Falls back automatically to simulated data on any failure.
   */
  static async fetchTicker(symbol: string): Promise<{
    symbol: string;
    price: number;
    volume: number;
    priceChangePercent: number;
    high: number;
    low: number;
    fundingRate: number;
    openInterest: number;
    isReal: boolean;
  }> {
    const isRealExchange = process.env.USE_REAL_EXCHANGE === "true";
    const cleanSymbol = symbol.replace("/", "").toUpperCase();

    // Default mock fallback generator
    const getFallback = () => {
      const basePrices: Record<string, number> = {
        "BTC/USDT": 67500,
        "ETH/USDT": 3500,
        "SOL/USDT": 145,
        "XRP/USDT": 0.55,
        "DOGE/USDT": 0.14
      };
      const basePrice = basePrices[symbol] || basePrices[symbol + "/USDT"] || basePrices[symbol.replace("/", "")] || 100;
      const randomPct = (Math.random() * 0.44 - 0.22) / 100;
      const fauxPrice = basePrice * (1 + randomPct);
      return {
        symbol: symbol,
        price: parseFloat(fauxPrice.toFixed(symbol.includes("XRP") || symbol.includes("DOGE") ? 4 : 2)),
        volume: basePrice * 285 + (Math.random() * 10000),
        priceChangePercent: parseFloat((randomPct * 100).toFixed(2)),
        high: parseFloat((basePrice * 1.035).toFixed(2)),
        low: parseFloat((basePrice * 0.965).toFixed(2)),
        fundingRate: 0.0001,
        openInterest: parseFloat((basePrice * 50000).toFixed(2)),
        isReal: false
      };
    };

    if (!isRealExchange) {
      return getFallback();
    }

    try {
      const res = await fetchWithTimeout(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${cleanSymbol}`);
      if (!res.ok) {
        throw new Error(`Bybit HTTP error: ${res.status}`);
      }
      const data: any = await res.json();
      if (data.retCode !== 0 || !data.result || !data.result.list || data.result.list.length === 0) {
        throw new Error(data.retMsg || "Bybit API returned invalid result list");
      }

      const tick = data.result.list[0];
      const lastPrice = parseFloat(tick.lastPrice);
      return {
        symbol: symbol,
        price: lastPrice,
        volume: parseFloat(tick.volume24h) || 0,
        priceChangePercent: parseFloat((parseFloat(tick.price24hPcnt) * 100).toFixed(2)) || 0,
        high: parseFloat(tick.highPrice24h) || lastPrice,
        low: parseFloat(tick.lowPrice24h) || lastPrice,
        fundingRate: parseFloat(tick.fundingRate) || 0.0001,
        openInterest: parseFloat(tick.openInterest) || 0,
        isReal: true
      };
    } catch (err: any) {
      console.error(`[ExchangeService] fetchTicker failed for ${symbol}: ${err.message}. Returning fallback.`);
      return getFallback();
    }
  }

  /**
   * Fetches orderbook listings (bids and asks).
   * Falls back automatically to simulated orderbook on failure.
   */
  static async fetchOrderBook(symbol: string, limit = 8): Promise<{
    bids: { price: number; quantity: number }[];
    asks: { price: number; quantity: number }[];
    isReal: boolean;
  }> {
    const isRealExchange = process.env.USE_REAL_EXCHANGE === "true";
    const cleanSymbol = symbol.replace("/", "").toUpperCase();

    // Default mock fallback generator
    const getFallback = () => {
      const basePrices: Record<string, number> = {
        "BTC/USDT": 67500,
        "ETH/USDT": 3500,
        "SOL/USDT": 145,
        "XRP/USDT": 0.55,
        "DOGE/USDT": 0.14
      };
      const basePrice = basePrices[symbol] || basePrices[symbol + "/USDT"] || basePrices[symbol.replace("/", "")] || 100;
      const bids: any[] = [];
      const asks: any[] = [];
      const spread = basePrice * 0.0003;
      
      for (let i = 1; i <= limit; i++) {
        const bidPrice = parseFloat((basePrice - spread - (i * basePrice * 0.0002)).toFixed(symbol.includes("XRP") || symbol.includes("DOGE") ? 4 : 2));
        const bidQty = parseFloat((Math.random() * 8.5 + 0.1).toFixed(symbol.includes("BTC") ? 3 : 1));
        bids.push({ price: bidPrice, quantity: bidQty });
        
        const askPrice = parseFloat((basePrice + spread + (i * basePrice * 0.0002)).toFixed(symbol.includes("XRP") || symbol.includes("DOGE") ? 4 : 2));
        const askQty = parseFloat((Math.random() * 8.5 + 0.1).toFixed(symbol.includes("BTC") ? 3 : 1));
        asks.push({ price: askPrice, quantity: askQty });
      }

      bids.sort((a, b) => b.price - a.price);
      asks.sort((a, b) => a.price - b.price);

      return { bids, asks, isReal: false };
    };

    if (!isRealExchange) {
      return getFallback();
    }

    try {
      const res = await fetchWithTimeout(`https://api.bybit.com/v5/market/orderbook?category=linear&symbol=${cleanSymbol}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Bybit HTTP error: ${res.status}`);
      }
      const data: any = await res.json();
      if (data.retCode !== 0 || !data.result) {
        throw new Error(data.retMsg || "Bybit API returned invalid result for orderbook");
      }

      const rawBids = data.result.b || [];
      const rawAsks = data.result.a || [];

      const formattedBids = rawBids.map((b: any) => ({
        price: parseFloat(b[0]),
        quantity: parseFloat(b[1]),
      }));

      const formattedAsks = rawAsks.map((a: any) => ({
        price: parseFloat(a[0]),
        quantity: parseFloat(a[1]),
      }));

      return {
        bids: formattedBids,
        asks: formattedAsks,
        isReal: true
      };
    } catch (err: any) {
      console.error(`[ExchangeService] fetchOrderBook failed for ${symbol}: ${err.message}. Returning fallback.`);
      return getFallback();
    }
  }
}
