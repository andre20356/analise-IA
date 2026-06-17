import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Percent,
  TrendingDown,
  BarChart4,
  RefreshCw,
  RefreshCw as RefreshIcon,
  Shield,
  Bot,
  Zap,
  Info,
  Target,
  Search,
  Coins
} from 'lucide-react';

import {
  UserConfig,
  SimulatedTrade,
  SystemLog,
  BalancePoint,
  MarketData,
  AISignalResponse,
  Opportunity,
  LearningRecord
} from './types';

import MetricCard from './components/MetricCard';
import ControlPanel from './components/ControlPanel';
import SignalCard from './components/SignalCard';
import OrderBookWidget from './components/OrderBookWidget';
import TradesTable from './components/TradesTable';
import LogViewer from './components/LogViewer';
import BalanceChart from './components/BalanceChart';
import FinancialGoals from './components/FinancialGoals';
import OpportunityScanner from './components/OpportunityScanner';
import CommandTerminal from './components/CommandTerminal';

export default function App() {
  const [config, setConfig] = useState<UserConfig>({
    apiKey: '',
    secretKey: '',
    connectedStatus: 'Desconectado',
    activeSymbol: 'BTC/USDT',
    virtualCapital: 1000,
    percentPerOperation: 10,
    currentBalance: 1000,
    stopLossPct: 2,
    takeProfitPct: 3,
    dailyGoalUSD: 50,
    weeklyGoalUSD: 350,
    monthlyGoalUSD: 1500,
    afterGoalChoice: 'CONTINUE',
    dailyGoalReachedAt: null,
    aiModeState: 'SEMI_AUTO',
    aiPaused: false,
    maxDailyTrades: 5
  });

  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalancePoint[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);
  
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [lastSignal, setLastSignal] = useState<AISignalResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'trading' | 'scan' | 'goals'>('trading');
  const [metrics, setMetrics] = useState({
    todayProfit: 0,
    weekProfit: 0,
    monthProfit: 0,
    daysWithMetaReached: 0,
    daysWithoutMetaReached: 0,
    avgTimeToGoal: 'Sem dados',
    avgDailyProfit: 0,
    bestDay: 'Sem dados',
    worstDay: 'Sem dados',
    opsNeeded: 0
  });

  // Fetch complete state from backend storage
  const fetchFullState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Falha ao comunicar com o servidor.');
      const data = await res.json();
      
      if (data && data.config) {
        setConfig(data.config);
      }
      if (data && data.trades) {
        setTrades(data.trades);
      }
      if (data && data.logs) {
        setLogs(data.logs);
      }
      if (data && data.balanceHistory) {
        setBalanceHistory(data.balanceHistory);
      }
      if (data && data.opportunities) {
        setOpportunities(data.opportunities);
      }
      if (data && data.learningRecords) {
        setLearningRecords(data.learningRecords);
      }
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
      setErrorBanner(null);
    } catch (err: any) {
      console.error(err);
      setErrorBanner('Servidor temporariamente indisponível. Aguarde a inicialização.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real-time market data (Bybit Public REST proxy) and trigger trade stop ticks
  const fetchMarketData = useCallback(async (symbolName: string) => {
    try {
      const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbolName)}`);
      if (!res.ok) throw new Error('Deu erro ao puxar dados da exchange.');
      const data = await res.json();
      
      if (data.success) {
        setMarketData(data.market);
        
        // After potential automatic ticker update triggers trade closure, reload state
        const stateRes = await fetch('/api/state');
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData && stateData.config) {
            setConfig(stateData.config);
          }
          if (stateData && stateData.trades) {
            setTrades(stateData.trades);
          }
          if (stateData && stateData.logs) {
            setLogs(stateData.logs);
          }
          if (stateData && stateData.balanceHistory) {
            setBalanceHistory(stateData.balanceHistory);
          }
          if (stateData && stateData.opportunities) {
            setOpportunities(stateData.opportunities);
          }
          if (stateData && stateData.learningRecords) {
            setLearningRecords(stateData.learningRecords);
          }
          if (stateData && stateData.metrics) {
            setMetrics(stateData.metrics);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao atualizar preços:', err);
    }
  }, []);

  // Sync state on boot
  useEffect(() => {
    fetchFullState();
  }, [fetchFullState]);

  // Interval routine for public market ticker & trade updates
  useEffect(() => {
    if (loading) return;
    
    // Initial fetch
    fetchMarketData(config.activeSymbol);

    // Regular interval (every 6 seconds keeps it fast and avoids API rate limiting)
    const interval = setInterval(() => {
      fetchMarketData(config.activeSymbol);
    }, 6000);

    return () => clearInterval(interval);
  }, [config.activeSymbol, loading, fetchMarketData]);

  // Handle configuration update of parameters
  const handleUpdateConfig = async (updated: Partial<UserConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        // Reload State
        await fetchFullState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle credentials API keys save
  const handleSaveKeys = async (apiKey: string, secretKey: string) => {
    try {
      const res = await fetch('/api/config/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secretKey }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchFullState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Test credentials with key connection validation
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.message) {
        setErrorBanner(data.message);
        setTimeout(() => setErrorBanner(null), 8500);
      }
      
      await fetchFullState();
    } catch (err) {
      console.error(err);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleStateUpdate = (updatedState: any) => {
    if (updatedState) {
      if (updatedState.config) setConfig(updatedState.config);
      if (updatedState.trades) setTrades(updatedState.trades);
      if (updatedState.logs) setLogs(updatedState.logs);
      if (updatedState.balanceHistory) setBalanceHistory(updatedState.balanceHistory);
      if (updatedState.opportunities) setOpportunities(updatedState.opportunities);
      if (updatedState.learningRecords) setLearningRecords(updatedState.learningRecords);
      if (updatedState.dailyProgress) {
        // dailyProgress is consumed by metrics calculation on the backend
      }
      if (updatedState.metrics) setMetrics(updatedState.metrics);
    }
  };

  // Call Gemini Model to analyze market and trigger simulation
  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('IA demorou a responder ou falhou no processamento.');
      const data = await res.json();
      
      if (data.success) {
        setLastSignal(data.signal);
        setTrades(data.updatedState.trades);
        setConfig(data.updatedState.config);
        setLogs(data.updatedState.logs);
        setBalanceHistory(data.updatedState.balanceHistory);
        if (data.updatedState.opportunities) setOpportunities(data.updatedState.opportunities);
        if (data.updatedState.learningRecords) setLearningRecords(data.updatedState.learningRecords);
        if (data.updatedState.metrics) setMetrics(data.updatedState.metrics);
      }
    } catch (err: any) {
      console.error(err);
      setErrorBanner(`Erro na análise: ${err.message}`);
      setTimeout(() => setErrorBanner(null), 5000);
    } finally {
      setAnalyzing(false);
    }
  };

  // Call Auto-Scanner to detect opportunities across pairs
  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('O scanner falhou ao mapear oportunidades.');
      const data = await res.json();
      
      if (data.success) {
        setOpportunities(data.updatedState.opportunities || []);
        setLearningRecords(data.updatedState.learningRecords || []);
        setTrades(data.updatedState.trades);
        setConfig(data.updatedState.config);
        setLogs(data.updatedState.logs);
        setBalanceHistory(data.updatedState.balanceHistory);
        if (data.updatedState.metrics) {
          setMetrics(data.updatedState.metrics);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorBanner(`Erro no escaner: ${err.message}`);
      setTimeout(() => setErrorBanner(null), 5000);
    } finally {
      setScanning(false);
    }
  };

  // Manual close open trades
  const handleManualClose = async (tradeId: string) => {
    if (!marketData) return;
    try {
      const res = await fetch('/api/trades/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          currentPrice: marketData.price
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchFullState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear system logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset entire simulator variables back to initial configurations
  const handleResetSimulation = async () => {
    if (!window.confirm('Deseja realmente limpar toda a simulação virtual? Isso apagará seu histórico de trades e redefinirá seu capital.')) return;
    try {
      const res = await fetch('/api/trades/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastSignal(null);
        setConfig(data.state.config);
        setTrades(data.state.trades);
        setLogs(data.state.logs);
        setBalanceHistory(data.state.balanceHistory);
        setOpportunities(data.state.opportunities || []);
        setLearningRecords(data.state.learningRecords || []);
        setMetrics({
          todayProfit: 0,
          weekProfit: 0,
          monthProfit: 0,
          daysWithMetaReached: 0,
          daysWithoutMetaReached: 0,
          avgTimeToGoal: 'Sem dados',
          avgDailyProfit: 0,
          bestDay: 'Sem dados',
          worstDay: 'Sem dados',
          opsNeeded: 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate high performance statistics metrics
  const stats = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED');
    const totalTrades = trades.length;
    
    let totalProfit = 0;
    let totalLoss = 0;
    let winCount = 0;

    closed.forEach((t) => {
      const profit = t.profitCapital || 0;
      if (profit >= 0) {
        totalProfit += profit;
        winCount++;
      } else {
        totalLoss += Math.abs(profit);
      }
    });

    const winRate = closed.length > 0 ? Math.round((winCount / closed.length) * 100) : 0;
    
    let sumConfidence = 0;
    trades.forEach((t) => {
      sumConfidence += t.confidence;
    });
    const avgConfidence = totalTrades > 0 ? Math.round(sumConfidence / totalTrades) : 0;

    // Get last simulated signal as string
    const lastSigString = trades[0]?.type || null;

    return {
      totalProfit,
      totalLoss,
      winRate,
      totalTrades,
      lastSigString,
      avgConfidence
    };
  }, [trades]);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans selection:bg-blue-500 selection:text-white" id="trading-assistant-hub">
      
      {/* Top Banner Warning or loading */}
      {errorBanner && (
        <div className="sticky top-0 z-50 bg-blue-600 text-white font-bold text-center px-4 py-1.5 border-b border-blue-500 text-xs flex items-center justify-center gap-1.5 shadow-lg">
          <Info className="w-3.5 h-3.5 animate-bounce" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Main Container Header */}
      <header className="border-b border-[#2b2f36] bg-[#161a1e] sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#1e2329] border border-[#2b2f36] rounded shadow-sm">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight flex items-center gap-2 text-white">
                AI TRADING ASSISTANT
                <span className="text-[9px] font-bold text-[#f0b90b] bg-[#f0b90b]/10 border border-[#f0b90b]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Simulado
                </span>
              </h1>
              <p className="text-[10px] text-[#848e9c]">Coleta em tempo real da Bybit & Análise preditiva Gemini 3.5-Flash</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {marketData && (
              <div className="bg-[#0b0e11] border border-[#2b2f36] rounded px-3 py-0.5 flex items-center gap-2 text-xs font-mono">
                <span className="text-[#848e9c] uppercase font-bold">{config.activeSymbol}</span>
                <span className={`font-bold ${marketData.priceChangePercent >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
                  {marketData.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                </span>
              </div>
            )}

            <button
              onClick={() => {
                fetchFullState();
                if (marketData) fetchMarketData(config.activeSymbol);
              }}
              disabled={loading}
              className="p-1.5 border border-[#474d57] bg-[#1e2329] hover:bg-[#2b2f36] text-[#eaecef] rounded transition-colors cursor-pointer"
              title="Forçar Sincronização"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hub Body wrapper */}
      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4 pb-12">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshIcon className="w-8 h-8 text-blue-500 animate-spin" />
            <h3 className="font-bold text-[#848e9c] text-xs">Carregando painel de negociações...</h3>
          </div>
        ) : (
          <>
            {/* KPI METRICS ROW */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" id="stats-grid">
              <MetricCard
                title="Saldo Virtual"
                value={`${config.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT`}
                subValue={`Disponível de ${config.virtualCapital} USDT`}
                icon={Wallet}
                iconColor="text-blue-400"
              />
              <MetricCard
                title="Saldo Real Bybit"
                value={
                  config.realExchangeBalance !== undefined && config.realExchangeBalance !== null
                    ? `${config.realExchangeBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT`
                    : 'Desconectado'
                }
                subValue={
                  config.realExchangeBalance !== undefined && config.realExchangeBalance !== null
                    ? 'Exchange ativa'
                    : 'Sem chaves API válidas'
                }
                icon={Coins}
                iconColor="text-amber-500"
                badge={
                  config.realExchangeBalance !== undefined && config.realExchangeBalance !== null
                    ? { text: 'Real', type: 'success' }
                    : { text: 'Simulado', type: 'warning' }
                }
              />
              <MetricCard
                title="Lucro Total"
                value={`${stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT`}
                icon={TrendingUp}
                iconColor="text-brand-green"
                badge={stats.totalProfit > 0 ? { text: `+${((stats.totalProfit / config.virtualCapital) * 100).toFixed(1)}%`, type: 'success' } : undefined}
              />
              <MetricCard
                title="Prejuízo Total"
                value={`${stats.totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} USDT`}
                icon={TrendingDown}
                iconColor="text-[#ea3943]"
              />
              <MetricCard
                title="Taxa de Acerto"
                value={`${stats.winRate}%`}
                subValue={`${trades.filter(t => t.status === 'CLOSED').length} fechados`}
                icon={Percent}
                iconColor="text-[#f0b90b]"
                badge={{ text: 'Média', type: 'info' }}
              />
              <MetricCard
                title="Total de Operações"
                value={stats.totalTrades}
                subValue={`Ativo: ${stats.lastSigString || 'Nenhum'}`}
                icon={BarChart4}
                iconColor="text-sky-400"
              />
            </section>

            {/* TABS CONTAINER */}
            <div className="flex border-b border-[#2b2f36] gap-2 pt-2 bg-transparent" id="tabs-navigation-root">
              <button
                onClick={() => setActiveTab('trading')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer uppercase tracking-tight ${
                  activeTab === 'trading'
                    ? 'border-amber-500 text-amber-500 font-extrabold'
                    : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Painel do Trader
              </button>
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer uppercase tracking-tight ${
                  activeTab === 'scan'
                    ? 'border-amber-500 text-amber-500 font-extrabold'
                    : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
                }`}
                id="scanner-tab-button"
              >
                <Search className="w-3.5 h-3.5" />
                Varredura de Oportunidades
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer uppercase tracking-tight relative ${
                  activeTab === 'goals'
                    ? 'border-amber-500 text-amber-500 font-extrabold'
                    : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Simulador de Metas
                {metrics.todayProfit >= (config.dailyGoalUSD || 50) && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'trading' && (
              <>
                {/* AI PREDICTIONS & CHARTS ROW */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="prediction-charts-area">
                  <div className="lg:col-span-1">
                    <SignalCard
                      signal={lastSignal}
                      onRunAnalysis={handleRunAnalysis}
                      analyzing={analyzing}
                      activeSymbol={config.activeSymbol}
                      config={config}
                      trades={trades}
                      currentPrice={marketData?.price}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <CommandTerminal
                      config={config}
                      onStateUpdate={handleStateUpdate}
                      trades={trades}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <BalanceChart
                      history={balanceHistory}
                      startingCapital={config.virtualCapital}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    {marketData ? (
                      <OrderBookWidget
                        orderBook={marketData.orderBook}
                        recentTrades={marketData.recentTrades}
                        price={marketData.price}
                        change={marketData.priceChangePercent}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-[#161a1e] border border-[#2b2f36] rounded h-full text-[#848e9c] text-xs text-center border-dashed">
                        <RefreshCw className="w-6 h-6 text-[#848e9c]/60 animate-spin mb-1.5" />
                        Buscando livro de ofertas e trades em tempo real...
                      </div>
                    )}
                  </div>
                </section>

                {/* MAIN SETTINGS MODULE */}
                <section id="config-module">
                  <ControlPanel
                    config={config}
                    onSaveKeys={handleSaveKeys}
                    onTestConnection={handleTestConnection}
                    onUpdateConfig={handleUpdateConfig}
                    testingConnection={testingConnection}
                    onResetSimulation={handleResetSimulation}
                  />
                </section>
              </>
            )}

            {activeTab === 'scan' && (
              <section id="scan-view-content" className="animate-fade-in">
                <OpportunityScanner
                  opportunities={opportunities}
                  learningRecords={learningRecords}
                  config={config}
                  metrics={metrics}
                  onRunScan={handleRunScan}
                  scanning={scanning}
                />
              </section>
            )}

            {activeTab === 'goals' && (
              <section id="goals-view-content" className="animate-fade-in">
                <FinancialGoals
                  config={config}
                  metrics={metrics}
                  onUpdateConfig={handleUpdateConfig}
                />
              </section>
            )}

            {/* TRADES ROW */}
            <section id="trades-history-module">
              <TradesTable
                trades={trades}
                onManualClose={handleManualClose}
                currentPrice={marketData?.price || 0}
              />
            </section>

            {/* LOGS MODULE */}
            <section id="logs-module">
              <LogViewer
                logs={logs}
                onClearLogs={handleClearLogs}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer system indicators */}
      <footer className="border-t border-[#2b2f36] bg-[#161a1e] py-4 px-4 text-center text-[#848e9c] text-[10px] uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-green" />
            <span>AI Trading Assistant - 100% Protegido em Modo Simulação Comercial</span>
          </p>
          <p>Bybit Public REST API v5 Client | Gemini 3.5 AI Core v2.4.0 @google/genai</p>
        </div>
      </footer>
    </div>
  );
}
