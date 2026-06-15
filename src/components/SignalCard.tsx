import React from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, Hourglass, HelpCircle, Zap, Award, AlertTriangle } from 'lucide-react';
import { AISignalResponse, UserConfig, SimulatedTrade } from '../types';

interface SignalCardProps {
  signal: AISignalResponse | null;
  onRunAnalysis: () => void;
  analyzing: boolean;
  activeSymbol: string;
  config: UserConfig;
  trades: SimulatedTrade[];
  currentPrice?: number;
}

export default function SignalCard({
  signal,
  onRunAnalysis,
  analyzing,
  activeSymbol,
  config,
  trades,
  currentPrice
}: SignalCardProps) {
  // Compute daily transactions and today's profit
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTradesCount = trades.filter((t) => t.entryTime && t.entryTime.startsWith(todayStr)).length;
  const maxDailyTrades = config.maxDailyTrades || 5;

  const dailyGoalUSD = config.dailyGoalUSD || 50;

  // Calculate today's profit from closed trades
  const todayProfit = parseFloat((trades
    .filter((t) => t.status === 'CLOSED' && t.exitTime && t.exitTime.startsWith(todayStr))
    .reduce((sum, t) => sum + (t.profitCapital || 0), 0)
  ).toFixed(2));

  const isMetaReached = todayProfit >= dailyGoalUSD;
  const isLimitReached = todayTradesCount >= maxDailyTrades;

  // Determine dynamic fields based on prompt instructions
  const trendLabel = signal ? signal.trend : 'LATERAL';
  const priceDisplay = currentPrice ? `${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT` : 'Buscando...';
  
  // Decide active action (COMPRA, VENDA, AGUARDAR, or NO NEW ENTRIES)
  let actionLabel: 'COMPRA' | 'VENDA' | 'AGUARDAR' | 'NÃO OPERAR MAIS HOJE' = 'AGUARDAR';
  if (isMetaReached) {
    actionLabel = 'NÃO OPERAR MAIS HOJE';
  } else if (signal) {
    if (signal.signal === 'COMPRA') actionLabel = 'COMPRA';
    else if (signal.signal === 'VENDA') actionLabel = 'VENDA';
  }

  const entryLabel = signal && signal.signal !== 'AGUARDAR' && currentPrice 
    ? `${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT` 
    : 'Sem Entrada';

  const riskLabel = signal 
    ? (signal.confidence > 80 ? 'Baixo' : signal.confidence > 65 ? 'Médio' : 'Alto') 
    : '---';

  const estimatedProfit = signal
    ? `+${(config.takeProfitPct ?? 3.0).toFixed(1)}%`
    : '---';

  const justificationText = signal 
    ? signal.motivo 
    : isMetaReached 
      ? 'A meta diária de lucros foi totalmente concluída hoje!' 
      : 'Aguardando inicialização do motor de IA para análise técnica.';

  return (
    <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md flex flex-col justify-between h-full" id="signal-card-box">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">IA Autônoma de Análise</h3>
          </div>
          <button
            onClick={onRunAnalysis}
            disabled={analyzing || isMetaReached || isLimitReached}
            className={`font-bold text-xs py-1.5 px-3 rounded shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 select-none ${
              isMetaReached 
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/25' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {analyzing ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Analisando...
              </>
            ) : isMetaReached ? (
              'Meta Concluída'
            ) : (
              `Analisar ${activeSymbol}`
            )}
          </button>
        </div>

        {/* Warning messages */}
        {isMetaReached && (
          <div className="mb-3 p-2 bg-emerald-950/40 border border-emerald-500/20 rounded text-[10px] text-emerald-400 flex items-center gap-1.5 font-bold uppercase animate-pulse">
            <Award className="w-3.5 h-3.5" />
            <span>META DIÁRIA ATINGIDA! STATUS: META CONCLUÍDA</span>
          </div>
        )}
        {!isMetaReached && isLimitReached && (
          <div className="mb-3 p-2 bg-red-950/40 border border-red-500/20 rounded text-[10px] text-red-100 flex items-center gap-1.5 font-bold uppercase">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>LIMITE DE ENTRADAS EXCEDIDO</span>
          </div>
        )}

        {/* Structured Grid defined by Prompt Guidelines */}
        <div className="bg-[#0b0e11] border border-[#2b2f36] rounded overflow-hidden">
          <div className="px-3 py-2 bg-[#1e2329]/65 border-b border-[#2b2f36] flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#848e9c] uppercase tracking-wide">Ficha Técnica Estratégica</span>
            <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-[8px] font-black uppercase bg-purple-950/40 text-purple-400 border border-purple-500/10">
              Operação em Lote
            </span>
          </div>

          <div className="divide-y divide-[#2b2f36] text-[11px]">
            {/* ATIVO */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Ativo</span>
              <span className="font-mono font-bold text-white">{activeSymbol}</span>
            </div>

            {/* TENDÊNCIA */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Tendência</span>
              <span className={`font-bold ${
                trendLabel === 'ALTA'
                  ? 'text-brand-green'
                  : trendLabel === 'BAIXA'
                  ? 'text-rose-400'
                  : 'text-amber-500'
              }`}>
                {trendLabel}
              </span>
            </div>

            {/* PREÇO ATUAL */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Preço Atual</span>
              <span className="font-mono font-bold text-white">{priceDisplay}</span>
            </div>

            {/* AÇÃO */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Ação</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                actionLabel === 'COMPRA'
                  ? 'bg-emerald-950 text-brand-green border border-brand-green/30'
                  : actionLabel === 'VENDA'
                  ? 'bg-rose-950 text-red-400 border border-rose-500/30'
                  : actionLabel === 'NÃO OPERAR MAIS HOJE'
                  ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                  : 'bg-zinc-800 text-[#848e9c]'
              }`}>
                {actionLabel}
              </span>
            </div>

            {/* ENTRADA */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Entrada</span>
              <span className="font-mono font-bold text-[#eaecef]">{entryLabel}</span>
            </div>

            {/* TAKE PROFIT */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase text-emerald-400">Take Profit</span>
              <span className="font-mono font-bold text-[#eaecef]">
                {signal && signal.takeProfitSugerido ? `${signal.takeProfitSugerido.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT` : '---'}
              </span>
            </div>

            {/* STOP LOSS */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase text-rose-400">Stop Loss</span>
              <span className="font-mono font-bold text-[#eaecef]">
                {signal && signal.stopLossSugerido ? `${signal.stopLossSugerido.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT` : '---'}
              </span>
            </div>

            {/* RISCO */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Risco</span>
              <span className={`font-bold ${
                riskLabel === 'Baixo' ? 'text-brand-green' : riskLabel === 'Médio' ? 'text-amber-500' : riskLabel === 'Alto' ? 'text-rose-400' : 'text-[#848e9c]'
              }`}>
                {riskLabel}
              </span>
            </div>

            {/* CONFIANÇA */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Confiança</span>
              <span className="font-bold text-purple-400">{signal ? `${signal.confidence}%` : '---'}</span>
            </div>

            {/* LUCRO ESTIMADO */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase">Lucro Estimado</span>
              <span className="font-mono font-bold text-brand-green">{estimatedProfit}</span>
            </div>

            {/* ENTRADAS HOJE */}
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[#848e9c] font-semibold uppercase font-semibold">Entradas Hoje</span>
              <span className="font-mono font-bold text-white">
                {todayTradesCount} / <span className="text-purple-400">{maxDailyTrades}</span>
              </span>
            </div>
          </div>
        </div>

        {/* JUSTIFICATIVA */}
        <div className="mt-3.5">
          <span className="text-[10px] font-bold text-[#848e9c] block mb-1 uppercase tracking-wide">Justificativa da Decisão IA</span>
          <p className="text-xs text-[#eaecef] bg-[#0b0e11] p-2.5 border border-[#2b2f36] rounded leading-relaxed italic">
            "{justificationText}"
          </p>
        </div>

        {/* PROXIMA AVALIACAO */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#848e9c]">
          <span className="uppercase">Próxima Avaliação</span>
          <span className="font-bold text-purple-400 uppercase">1min / 5min</span>
        </div>
      </div>

      <div className="mt-3.5 pt-3.5 border-t border-[#2b2f36] flex items-center justify-between text-[9px] text-[#848e9c] uppercase">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          Execução Estratégica Autônoma Ativa
        </span>
        <span className="font-semibold">{config.aiModel || 'gemini-3.5-flash'}</span>
      </div>
    </div>
  );
}
