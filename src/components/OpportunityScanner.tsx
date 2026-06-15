import React, { useState } from 'react';
import {
  Search,
  Zap,
  CheckCircle,
  XCircle,
  Play,
  RotateCw,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { Opportunity, LearningRecord, UserConfig } from '../types';

interface OpportunityScannerProps {
  opportunities: Opportunity[];
  learningRecords: LearningRecord[];
  config: UserConfig;
  metrics: any;
  onRunScan: () => Promise<void>;
  scanning: boolean;
}

export default function OpportunityScanner({
  opportunities = [],
  learningRecords = [],
  config,
  metrics,
  onRunScan,
  scanning
}: OpportunityScannerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scanSteps, setScanSteps] = useState<string>('');
  
  const handleTriggerScan = async () => {
    // Stage animate scanning triggers
    const steps = [
      'Conectando ao feed global REST Bybit...',
      'Processando livros de ofertas e liquidez passiva para BTC, ETH, SOL, XRP e DOGE...',
      'Calculando RSI, volatilidade intradiária e cruzamento de médias móveis...',
      'Identificando rompimentos de suportes/resistências e fluxo de volume...',
      'Avaliando canais de risco e calibrando Stop Loss/Take Profit 1:2...'
    ];

    let t = 0;
    setScanSteps(steps[0]);
    const interval = setInterval(() => {
      t++;
      if (t < steps.length) {
        setScanSteps(steps[t]);
      } else {
        clearInterval(interval);
      }
    }, 900);

    try {
      await onRunScan();
    } finally {
      clearInterval(interval);
      setScanSteps('');
    }
  };

  const getStatusBadgeClass = (status: Opportunity['status']) => {
    switch (status) {
      case 'APROVADO':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
      case 'DESCARTADO':
        return 'bg-red-500/15 border-red-500/30 text-red-400';
      default:
        return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    }
  };

  const getSignalBadgeClass = (sig: Opportunity['signal']) => {
    switch (sig) {
      case 'COMPRA':
        return 'bg-emerald-500 text-black font-extrabold';
      case 'VENDA':
        return 'bg-red-500 text-white font-extrabold';
      default:
        return 'bg-gray-700 text-gray-300 font-bold';
    }
  };

  // Find the highest confidence opportunity currently mapped
  const bestOpportunity = opportunities.length > 0 ? opportunities[0] : null;

  return (
    <div className="space-y-4 animate-fade-in" id="opportunity-scanner-root">
      
      {/* SCANNING HEADER ACTION */}
      <div className="bg-[#161a1e] border border-[#2b2f36] p-4 rounded flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2 justify-center sm:justify-start">
            <Search className="w-4 h-4 text-amber-500 animate-pulse" />
            Scanner de Oportunidades Em Tempo Real Bybit
          </h3>
          <p className="text-xs text-[#848e9c]">
            Varredura contínua e algorítmica de 5 ativos principais com identificação de tendências, volumes institucionais e correlação técnica.
          </p>
        </div>
        
        <button
          onClick={handleTriggerScan}
          disabled={scanning}
          className={`px-4 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-tight shadow-md min-w-[210px] ${
            scanning
              ? 'bg-[#1e2329] border border-[#2b2f36] text-[#848e9c] cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-black hover:brightness-110 active:scale-95'
          }`}
          id="trigger-opportunities-scan-btn"
        >
          <RotateCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin text-amber-400' : ''}`} />
          {scanning ? 'Sincronizando feed...' : 'Executar Varredura Geral'}
        </button>
      </div>

      {scanning && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded flex items-center gap-3 animate-pulse text-xs text-amber-400" id="scan-loading-steps">
          <Activity className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="font-mono font-medium">{scanSteps || 'Analisando livro de ofertas de compra e venda Bybit...'}</span>
        </div>
      )}

      {/* BEST OPPORTUNITY HIGHLIGHT OR EMPTY STATE */}
      {bestOpportunity ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="banner-scanner-grid">
          
          <div className="lg:col-span-2 bg-gradient-to-r from-amber-500/10 to-transparent border border-[#2b2f36] p-4 rounded relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute right-3 top-3 filter opacity-10">
              <Sparkles className="w-24 h-24 text-amber-500" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider bg-amber-500 text-black flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Melhor Oportunidade Atual
                </span>
                {bestOpportunity.status === 'APROVADO' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase font-mono animate-pulse">
                    Executado auto
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">{bestOpportunity.asset}</h2>
                  <p className="text-xs text-[#848e9c] mt-0.5 mt-1 font-mono">
                    Preço de Descoberta: <strong className="text-white text-xs">{bestOpportunity.price.toLocaleString('en-US', { minimumFractionDigits: bestOpportunity.asset.includes('XRP') || bestOpportunity.asset.includes('DOGE') ? 4 : 2 })} USDT</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono font-extrabold text-[#f0b90b]">{bestOpportunity.confidence}%</span>
                  <p className="text-[10px] uppercase text-[#848e9c] font-bold tracking-wider">Confiança Geral</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 text-xs text-center font-mono">
                <div className="bg-[#1e2329]/80 border border-[#2b2f36] p-1.5 rounded">
                  <span className="block text-[9px] uppercase text-[#848e9c]">Sinal Calculado</span>
                  <span className={`block font-extrabold text-xs mt-0.5 ${bestOpportunity.signal === 'COMPRA' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {bestOpportunity.signal}
                  </span>
                </div>
                <div className="bg-[#1e2329]/80 border border-[#2b2f36] p-1.5 rounded">
                  <span className="block text-[9px] uppercase text-[#848e9c]">Stop Loss (Risco)</span>
                  <span className="block font-bold text-xs mt-0.5 text-red-300">
                    {bestOpportunity.stopLoss.toLocaleString('en-US', { minimumFractionDigits: bestOpportunity.asset.includes('XRP') || bestOpportunity.asset.includes('DOGE') ? 4 : 2 })}
                  </span>
                </div>
                <div className="bg-[#1e2329]/80 border border-[#2b2f36] p-1.5 rounded">
                  <span className="block text-[9px] uppercase text-[#848e9c]">Take Profit (R:R)</span>
                  <span className="block font-bold text-xs mt-0.5 text-emerald-300">
                    {bestOpportunity.takeProfit.toLocaleString('en-US', { minimumFractionDigits: bestOpportunity.asset.includes('XRP') || bestOpportunity.asset.includes('DOGE') ? 4 : 2 })} ({bestOpportunity.riskRewardRatio})
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#2b2f36] pt-3">
              <span className="text-[10px] uppercase font-bold text-[#848e9c] block mb-1">Evidências Técnicas & Justificativa:</span>
              <ul className="space-y-1 text-xs text-zinc-300">
                {bestOpportunity.justification.slice(0, 3).map((item, index) => (
                  <li key={index} className="flex items-start gap-1.5 font-sans leading-snug">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DYNAMIC PROGRESS TARGET REACTION CARD */}
          <div className="bg-[#161a1e] border border-[#2b2f36] p-4 rounded flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#848e9c] block tracking-wider">Monitoramento Intraintradiário de Metas</span>
              <h4 className="text-white font-black text-sm uppercase">Foco Meta Diária</h4>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#848e9c]">Lucro Hoje:</span>
                <span className={`text-base font-mono font-extrabold ${metrics.todayProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.todayProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#848e9c]">Alvo Diário:</span>
                <span className="text-xs font-mono font-bold text-white">
                  {config.dailyGoalUSD} USDT
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-[#1e2329] rounded-full h-2 overflow-hidden border border-[#2b2f36]">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (metrics.todayProfit / (config.dailyGoalUSD || 50)) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-[#848e9c] font-bold">
                  <span>{Math.round(Math.min(100, Math.max(0, (metrics.todayProfit / (config.dailyGoalUSD || 50)) * 100)))}% BATIDO</span>
                  <span>{metrics.opsNeeded} OP NECESSÁRIAS</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0e11] border border-[#2b2f36] p-2 rounded text-[10px] space-y-1 text-zinc-300">
              <div className="flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider">
                <Info className="w-3 h-3" />
                <span>Estratégia de Risco Geral:</span>
              </div>
              <p className="leading-snug text-[10px] text-[#848e9c]">
                Ajustando apenas a frequência de monitoramento técnico e rastreamento. Limites de perda protegidos a <strong className="text-zinc-200">{config.stopLossPct}% SL</strong> e preservando risco por operação.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-8 text-center text-zinc-400 border-dashed" id="empty-opportunities-banner">
          <Activity className="w-8 h-8 mx-auto text-amber-500/70 animate-pulse mb-3" />
          <h4 className="text-white font-bold text-sm">Nenhuma oportunidade mapeada nas últimas horas</h4>
          <p className="text-xs text-[#848e9c] max-w-md mx-auto mt-1 leading-relaxed">
            Clique no botão acima "Executar Varredura Geral" para mapear os 5 pares ativos através da API encriptada Bybit.
          </p>
        </div>
      )}

      {/* DETAILED SCANNED OPPORTUNITIES GRID / ACCORDION */}
      {opportunities.length > 0 && (
        <div className="space-y-2.5" id="scanned-grid-wrapper">
          <h4 className="text-xs uppercase text-[#848e9c] font-bold tracking-wider flex items-center gap-1.5 pt-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Últimas Oportunidades Rastreadas Pelo Scanner ({opportunities.length})
          </h4>

          <div className="bg-[#161a1e] border border-[#2b2f36] rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-[#0b0e11] text-[#848e9c] uppercase font-bold text-[10px] tracking-wider border-b border-[#2b2f36]">
                    <th className="py-2.5 px-4">Ativo</th>
                    <th className="py-2.5 px-4">Rating IA</th>
                    <th className="py-2.5 px-4">Sinal</th>
                    <th className="py-2.5 px-4">Preço Entrada</th>
                    <th className="py-2.5 px-4">SL / TP sugeridos</th>
                    <th className="py-2.5 px-4">Volume / R:R</th>
                    <th className="py-2.5 px-4 text-right">Ação Robô</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2f36]">
                  {opportunities.map((opt) => {
                    const isExpanded = expandedId === opt.id;
                    const isApproved = opt.status === 'APROVADO';
                    const isDiscarded = opt.status === 'DESCARTADO';
                    
                    return (
                      <React.Fragment key={opt.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : opt.id)}
                          className="hover:bg-[#1e2329]/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                            <span>{opt.asset}</span>
                            <span className="text-[8px] text-[#848e9c] font-mono font-normal block">
                              {new Date(opt.timestamp).toLocaleTimeString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">
                            <span className={opt.confidence >= 75 ? 'text-emerald-400' : opt.confidence >= 60 ? 'text-amber-400' : 'text-zinc-400'}>
                              {opt.confidence}%
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[9px] ${getSignalBadgeClass(opt.signal)}`}>
                              {opt.signal}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {opt.price.toLocaleString('en-US', { minimumFractionDigits: opt.asset.includes('XRP') || opt.asset.includes('DOGE') ? 4 : 2 })}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] space-y-0.5">
                            <div className="flex gap-2">
                              <span className="text-red-400">SL: {opt.stopLoss}</span>
                              <span className="text-emerald-400">TP: {opt.takeProfit}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] space-y-0.5">
                            <div className="flex flex-col">
                              <span className="text-[#848e9c] text-[10px]">R:R {opt.riskRewardRatio}</span>
                              <span className={opt.volumeAboveAvg ? 'text-zinc-200 text-[10px] font-bold' : 'text-[#848e9c] text-[10px]'}>
                                Vol: {opt.volumeAboveAvg ? 'Altíssimo' : 'Normal'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block px-1.5 py-0.5 border rounded text-[9px] font-bold ${getStatusBadgeClass(opt.status)}`}>
                              {opt.status}
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#0b0e11]/50">
                            <td colSpan={7} className="py-4 px-6 border-t border-[#2b2f36]">
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <h5 className="text-white font-bold text-xs">Análise Modular da IA Bybit:</h5>
                                  <p className="text-zinc-400 text-xs italic leading-relaxed">
                                    "{opt.motivo}"
                                  </p>
                                </div>

                                <div className="space-y-1 pt-1">
                                  <h6 className="text-[10px] uppercase font-extrabold text-[#848e9c] tracking-wider">Estágios e Condicionais Analisadas:</h6>
                                  <ul className="space-y-1.5 text-xs text-zinc-300">
                                    {opt.justification.map((just, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        <span>{just}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {isApproved && (
                                  <div className="bg-emerald-500/10 border border-emerald-500/15 rounded p-2 text-[10px] text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Esta oportunidade atingiu todos os limites mínimos e foi aprovada. O robô abriu uma operação virtual conectada.</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEARNING FACTORS HISTORY SECTION */}
      <section className="space-y-3" id="learning-section-root">
        <h4 className="text-xs uppercase text-[#848e9c] font-bold tracking-wider flex items-center gap-1.5 pt-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Análise de Aprendizado da IA Bybit (Pós-Tratamento de Trades)
        </h4>

        {learningRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="learning-cards-grid">
            {learningRecords.slice(0, 4).map((record) => (
              <div
                key={record.id}
                className={`bg-[#161a1e] border p-3 rounded space-y-2.5 transition-all duration-300 relative overflow-hidden ${
                  record.outcome === 'WIN' ? 'border-emerald-500/15 hover:border-emerald-500/35' : 'border-red-500/15 hover:border-red-500/35'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <div className="space-y-0.5">
                    <span className="text-white font-bold text-xs flex items-center gap-1">
                      {record.asset}
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.1 select-none rounded ${
                        record.outcome === 'WIN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {record.outcome === 'WIN' ? 'Vitória' : 'Derrota'}
                      </span>
                    </span>
                    <span className="text-[9px] text-[#848e9c] font-mono block">
                      {new Date(record.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-extrabold text-xs ${record.profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {record.profitPct >= 0 ? '+' : ''}{record.profitPct}% ROI
                    </span>
                    <span className="block text-[8px] uppercase text-[#848e9c] font-bold">Feedback IA</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-300">
                  <div className="text-[10px] font-bold uppercase text-[#848e9c] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-500" />
                    <span>Fatores de Atribuição de Resultado:</span>
                  </div>
                  <ul className="space-y-1 text-[11px] pl-1 text-[#848e9c]">
                    {record.factors.map((f, i) => (
                      <li key={i} className="flex gap-1.5 items-start">
                        <span className="text-amber-400 shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-[#0b0e11] border border-[#2b2f36] p-2 rounded text-[11px] leading-relaxed zinc-300">
                    <strong className="text-zinc-200">Lições registradas:</strong> {record.lessons}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-6 text-center text-[#848e9c] text-xs">
            <BookOpen className="w-6 h-6 mx-auto text-[#848e9c]/60 max-w-sm mb-1.5" />
            <h5 className="font-bold text-white">Relatório de Aprendizado em espera</h5>
            <p className="max-w-md mx-auto mt-0.5 leading-relaxed">
              Quando suas operações simuladas forem encerradas (por atingirem Take Profit ou Stop Loss), a IA irá automaticamente analisar as condições do fechamento para calibrar as próximas varreduras.
            </p>
          </div>
        )}
      </section>

    </div>
  );
}
