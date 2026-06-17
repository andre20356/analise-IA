export type ConnectionStatus = 'Conectado' | 'Conectado (Simulado)' | 'Desconectado' | 'Erro de autenticação';

export type AfterGoalChoice = 'CONTINUE' | 'STOP_NEW_ENTRIES';

export interface DailyGoalProgress {
  date: string; // YYYY-MM-DD
  profit: number;
  goal: number;
  reached: boolean;
  reachedAt: string | null;
  firstTradeTime: string | null;
}

export interface UserConfig {
  apiKey: string;
  secretKey: string;
  connectedStatus: ConnectionStatus;
  activeSymbol: string;
  virtualCapital: number;
  percentPerOperation: number;
  currentBalance: number;
  stopLossPct: number;
  takeProfitPct: number;
  dailyGoalUSD: number;
  weeklyGoalUSD: number;
  monthlyGoalUSD: number;
  afterGoalChoice: AfterGoalChoice;
  dailyGoalReachedAt: string | null;
  aiApiKey?: string;
  aiModel?: string;
  aiProvider?: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'custom';
  aiCustomUrl?: string;
  maxDailyTrades?: number;
  aiPaused?: boolean;
  aiModeState?: 'ANALYTIC' | 'SEMI_AUTO' | 'AUTO';
  realExchangeBalance?: number | null;
  maxDrawdownDiario?: number;
  maxDrawdownGlobal?: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface Trade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  priceChangePercent: number;
  high: number;
  low: number;
  fundingRate: number;
  openInterest: number;
  volatility: number;
  candles: Candle[];
  orderBook: OrderBook;
  recentTrades: Trade[];
  updatedAt: string;
}

export interface AISignalResponse {
  trend: 'ALTA' | 'BAIXA' | 'INDEFINIDA';
  probabilityUp: number;
  probabilityDown: number;
  confidence: number;
  justification: string[];
  motivo: string;
  signal: 'COMPRA' | 'VENDA' | 'AGUARDAR';
  stopLossSugerido: number;
  takeProfitSugerido: number;
}

export interface SimulatedTrade {
  id: string;
  asset: string;
  type: 'COMPRA' | 'VENDA';
  status: 'OPEN' | 'CLOSED';
  entryPrice: number;
  exitPrice: number | null;
  entryTime: string;
  exitTime: string | null;
  sizePct: number;
  investedCapital: number;
  profitPct: number | null;
  profitCapital: number | null;
  confidence: number;
  stopLoss: number;
  takeProfit: number;
  durationMs: number | null;
  exitReason: string | null;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'connection' | 'error' | 'api' | 'ai' | 'trade' | 'system';
  message: string;
}

export interface BalancePoint {
  timestamp: string;
  balance: number;
}

export interface DashboardStats {
  balance: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  totalTrades: number;
  lastSignal: 'COMPRA' | 'VENDA' | 'AGUARDAR' | null;
  avgConfidence: number;
  balanceHistory: BalancePoint[];
}

export interface Opportunity {
  id: string;
  timestamp: string; // ISO
  asset: string;
  price: number;
  trend: 'ALTA' | 'BAIXA' | 'INDEFINIDA';
  confidence: number;
  signal: 'COMPRA' | 'VENDA' | 'AGUARDAR';
  stopLoss: number;
  takeProfit: number;
  justification: string[];
  motivo: string;
  volumeAboveAvg: boolean;
  riskRewardRatio: string;
  status: 'PENDENTE' | 'APROVADO' | 'DESCARTADO';
  tradeId?: string;
}

export interface LearningRecord {
  id: string;
  timestamp: string;
  asset: string;
  type: 'COMPRA' | 'VENDA';
  outcome: 'WIN' | 'LOSS';
  profitPct: number;
  confidence: number;
  factors: string[];
  lessons: string;
}

export interface DBState {
  config: UserConfig;
  trades: SimulatedTrade[];
  logs: SystemLog[];
  balanceHistory: BalancePoint[];
  dailyProgress: DailyGoalProgress[];
  opportunities?: Opportunity[];
  learningRecords?: LearningRecord[];
}
