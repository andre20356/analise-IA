import React, { useState, useEffect } from 'react';
import { Target, Trophy, TrendingUp, HelpCircle, Save, CheckCircle2, AlertOctagon, Clock, Calendar, CheckSquare, Shield, Coins, AlertCircle } from 'lucide-react';
import { UserConfig } from '../types';

interface FinancialGoalsProps {
  config: UserConfig;
  metrics: {
    todayProfit: number;
    weekProfit: number;
    monthProfit: number;
    daysWithMetaReached: number;
    daysWithoutMetaReached: number;
    avgTimeToGoal: string;
    avgDailyProfit: number;
    bestDay: string;
    worstDay: string;
    opsNeeded: number;
  };
  onUpdateConfig: (updated: Partial<UserConfig>) => Promise<void>;
}

export default function FinancialGoals({
  config,
  metrics,
  onUpdateConfig
}: FinancialGoalsProps) {
  const [dailyInput, setDailyInput] = useState(config.dailyGoalUSD?.toString() || '50');
  const [weeklyInput, setWeeklyInput] = useState(config.weeklyGoalUSD?.toString() || '350');
  const [monthlyInput, setMonthlyInput] = useState(config.monthlyGoalUSD?.toString() || '1500');
  const [choice, setChoice] = useState<UserConfig['afterGoalChoice']>(config.afterGoalChoice || 'CONTINUE');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setDailyInput((config.dailyGoalUSD ?? 50).toString());
    setWeeklyInput((config.weeklyGoalUSD ?? 350).toString());
    setMonthlyInput((config.monthlyGoalUSD ?? 1500).toString());
    setChoice(config.afterGoalChoice ?? 'CONTINUE');
  }, [config.dailyGoalUSD, config.weeklyGoalUSD, config.monthlyGoalUSD, config.afterGoalChoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateConfig({
        dailyGoalUSD: parseFloat(dailyInput) || 50,
        weeklyGoalUSD: parseFloat(weeklyInput) || 350,
        monthlyGoalUSD: parseFloat(monthlyInput) || 1500,
        afterGoalChoice: choice
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const todayPct = Math.min(100, Math.max(0, (metrics.todayProfit / (config.dailyGoalUSD || 50)) * 100));
  const weekPct = Math.min(100, Math.max(0, (metrics.weekProfit / (config.weeklyGoalUSD || 350)) * 100));
  const monthPct = Math.min(100, Math.max(0, (metrics.monthProfit / (config.monthlyGoalUSD || 1500)) * 100));

  const isTodayGoalReached = metrics.todayProfit >= (config.dailyGoalUSD || 50);

  return (
    <div className="space-y-4">
      {/* Target Achieved Celebration Banner */}
      {isTodayGoalReached && (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/30 rounded p-4 shadow-xl relative overflow-hidden animate-fade-in group" id="celebration-banner-goal">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl group-hover:bg-emerald-500/10 transition-all duration-700 pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs bg-emerald-500 text-black font-semibold uppercase px-2 py-0.5 rounded tracking-wide font-mono">Meta Diária Batida!</span>
                {config.dailyGoalReachedAt && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Registrado às: {new Date(config.dailyGoalReachedAt).toLocaleTimeString('pt-BR')}
                  </span>
                )}
              </div>
              <h4 className="text-white font-bold text-base">Parabéns! Sua meta financeira de {config.dailyGoalUSD} USD foi atingida com sucesso!</h4>
              <p className="text-xs text-[#848e9c]">
                Lucro acumulado hoje: <strong className="text-emerald-400 text-sm font-mono">{metrics.todayProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</strong> (ROI realimentado das cotações da Bybit).
              </p>
            </div>
            
            {/* Direct Switch for behavior when goal hit */}
            <div className="bg-[#1e2329]/80 border border-[#2b2f36] p-2.5 rounded text-xs space-y-1 w-full sm:w-auto">
              <span className="block text-[10px] text-[#848e9c] font-bold uppercase mb-1">Ação Pós-Meta Ativa:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setChoice('CONTINUE');
                    onUpdateConfig({ afterGoalChoice: 'CONTINUE' });
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    choice === 'CONTINUE'
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-[#0b0e11] hover:bg-[#161a1e] border border-[#2b2f36] text-[#848e9c]'
                  }`}
                >
                  Continuar Buscando
                </button>
                <button
                  onClick={() => {
                    setChoice('STOP_NEW_ENTRIES');
                    onUpdateConfig({ afterGoalChoice: 'STOP_NEW_ENTRIES' });
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                    choice === 'STOP_NEW_ENTRIES'
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-[#0b0e11] hover:bg-[#161a1e] border border-[#2b2f36] text-[#848e9c]'
                  }`}
                >
                  Bloquear Entradas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of config and progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Progress Tracker (Left) */}
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 col-span-1 lg:col-span-7 space-y-4" id="goals-progress-tracker">
          <div className="flex items-center gap-2 pb-1 border-b border-[#2b2f36]">
            <Target className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Progresso dos Objetivos</h3>
          </div>

          <div className="space-y-4">
            {/* Daily progress */}
            <div className="space-y-1.5" id="progress-card-daily">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-[#eaecef]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Meta do Dia
                </span>
                <span className="font-mono text-[11px] text-[#eaecef]">
                  <strong className={metrics.todayProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {metrics.todayProfit >= 0 ? '+' : ''}{metrics.todayProfit.toFixed(2)}
                  </strong>
                  <span className="text-[#848e9c]"> / {config.dailyGoalUSD} USD</span>
                  <span className="ml-1.5 font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded text-[9px]">
                    {todayPct.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="w-full bg-[#0b0e11] h-2.5 rounded-full overflow-hidden border border-[#2b2f36]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTodayGoalReached ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'
                  }`}
                  style={{ width: `${todayPct}%` }}
                />
              </div>
            </div>

            {/* Weekly progress */}
            <div className="space-y-1.5" id="progress-card-weekly">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-[#eaecef]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Meta da Semana
                </span>
                <span className="font-mono text-[11px] text-[#eaecef]">
                  <strong className={metrics.weekProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {metrics.weekProfit >= 0 ? '+' : ''}{metrics.weekProfit.toFixed(2)}
                  </strong>
                  <span className="text-[#848e9c]"> / {config.weeklyGoalUSD} USD</span>
                  <span className="ml-1.5 font-bold text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded text-[9px]">
                    {weekPct.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="w-full bg-[#0b0e11] h-2.5 rounded-full overflow-hidden border border-[#2b2f36]">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${weekPct}%` }}
                />
              </div>
            </div>

            {/* Monthly progress */}
            <div className="space-y-1.5" id="progress-card-monthly">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-1.5 text-[#eaecef]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Meta do Mês
                </span>
                <span className="font-mono text-[11px] text-[#eaecef]">
                  <strong className={metrics.monthProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {metrics.monthProfit >= 0 ? '+' : ''}{metrics.monthProfit.toFixed(2)}
                  </strong>
                  <span className="text-[#848e9c]"> / {config.monthlyGoalUSD} USD</span>
                  <span className="ml-1.5 font-bold text-purple-400 bg-purple-400/10 px-1 py-0.5 rounded text-[9px]">
                    {monthPct.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="w-full bg-[#0b0e11] h-2.5 rounded-full overflow-hidden border border-[#2b2f36]">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${monthPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Operations Needed / Status Advice widget */}
          <div className="p-3 bg-[#0b0e11] border border-[#2b2f36] rounded flex gap-3 text-xs">
            <Coins className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <span className="font-bold text-[#eaecef] block text-[11px]">Controle Inteligente de Risco:</span>
              <p className="text-[#848e9c]">
                {isTodayGoalReached ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Meta concluída para hoje! Nenhuma operação pendente necessária hoje.
                  </span>
                ) : (
                  <span>
                    Falta <strong className="text-white font-mono">{Math.max(0, config.dailyGoalUSD - metrics.todayProfit).toFixed(2)} USDT</strong> para atingir a meta diária. São necessárias aproximadamente <strong className="text-amber-400 font-mono font-bold text-sm bg-amber-500/10 px-1.5 py-0.5 rounded inline-block mx-0.5">{metrics.opsNeeded}</strong> operações bem-sucedidas considerando seu perfil de risco configurado de {config.percentPerOperation}% e take profit planejado de {config.takeProfitPct}%.
                  </span>
                )}
              </p>
              <div className="text-[10px] text-amber-400/80 flex items-center gap-1 font-semibold pt-1">
                <Shield className="w-3 h-3 text-brand-green" />
                <span>Risco Protegido: A IA calibra apenas a busca, nunca burlando limites de SL/TP nem inflando alavancagem.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configurations Form (Right) */}
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 col-span-1 lg:col-span-5 space-y-4" id="goals-config-panel">
          <div className="flex items-center gap-2 pb-1 border-b border-[#2b2f36]">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Parametrizar Metas</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-[#848e9c] uppercase mb-1">Meta Diária (U)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={dailyInput}
                    onChange={(e) => setDailyInput(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1 text-xs text-white font-mono font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#848e9c] uppercase mb-1">Meta Semanal (U)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={weeklyInput}
                    onChange={(e) => setWeeklyInput(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1 text-xs text-white font-mono font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#848e9c] uppercase mb-1">Meta Mensal (U)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={monthlyInput}
                    onChange={(e) => setMonthlyInput(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1 text-xs text-white font-mono font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* AI Control behavior selection */}
            <div>
              <label className="block text-[9px] font-bold text-[#848e9c] uppercase mb-1.5 flex items-center gap-1">
                Ao Atingir a Meta Diária:
                <HelpCircle className="w-3 h-3 text-[#min-gray]" title="Escolha se o robô encerra novas entradas ou continua rastreando oportunidades." />
              </label>
              <div className="space-y-1.5 text-xs">
                <label className="flex items-center gap-2 p-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-md hover:bg-[#161a1e] transition-colors cursor-pointer block">
                  <input
                    type="radio"
                    name="afterGoalChoice"
                    value="CONTINUE"
                    checked={choice === 'CONTINUE'}
                    onChange={() => setChoice('CONTINUE')}
                    className="text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-white block text-[11px]">Continuar analisando mercado</span>
                    <span className="text-[10px] text-[#848e9c]">Continua executando análise preditiva e realizando ordens virtuais.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-[#0b0e11] border border-[#2b2f36] rounded-md hover:bg-[#161a1e] transition-colors cursor-pointer block">
                  <input
                    type="radio"
                    name="afterGoalChoice"
                    value="STOP_NEW_ENTRIES"
                    checked={choice === 'STOP_NEW_ENTRIES'}
                    onChange={() => setChoice('STOP_NEW_ENTRIES')}
                    className="text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-white block text-[11px]">Encerrar novas entradas até o próximo dia</span>
                    <span className="text-[10px] text-[#848e9c]">Suspende novas operações simuladas no dia para proteger o capital.</span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black text-xs font-bold py-1.5 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Gravando...' : 'Salvar Configurações de Metas'}
            </button>

            {saveSuccess && (
              <div className="p-1.5 bg-emerald-950/20 border border-emerald-500/20 text-[#00c076] text-[10px] rounded text-center font-semibold animate-fade-in">
                Configurações de Metas gravadas com sucesso!
              </div>
            )}
          </form>
        </div>

      </div>

      {/* Advanced Goals Performance Stats Box */}
      <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 space-y-3" id="financial-goals-stats">
        <div className="flex items-center justify-between pb-1 border-b border-[#2b2f36]">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-brand-green" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Métricas Históricas de Metas</h3>
          </div>
          <span className="text-[10px] font-bold text-[#848e9c] font-mono">Consolidado em Tempo Real</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          {/* Reached Days */}
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 text-center flex flex-col justify-between">
            <span className="text-[9px] font-bold text-[#848e9c] uppercase block">Dias Concluídos</span>
            <div className="my-1 text-emerald-400 font-mono font-bold text-lg flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {metrics.daysWithMetaReached}
            </div>
            <span className="text-[8px] text-[#848e9c]">com lucro ≥ meta</span>
          </div>

          {/* Pending Days */}
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 text-center flex flex-col justify-between">
            <span className="text-[9px] font-bold text-[#848e9c] uppercase block">Dias Pendentes</span>
            <div className="my-1 text-amber-500 font-mono font-bold text-lg">
              {metrics.daysWithoutMetaReached}
            </div>
            <span className="text-[8px] text-[#848e9c]">rastreados sem meta</span>
          </div>

          {/* Avg Duration to reach goal */}
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 text-center flex flex-col justify-between">
            <span className="text-[9px] font-bold text-[#848e9c] uppercase block">Tempo Médio Metas</span>
            <div className="my-1 text-white font-mono font-bold text-sm flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-[#848e9c]" />
              {metrics.avgTimeToGoal}
            </div>
            <span className="text-[8px] text-[#848e9c]">desde o 1º trade do dia</span>
          </div>

          {/* Average daily profit */}
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 text-center flex flex-col justify-between">
            <span className="text-[9px] font-bold text-[#848e9c] uppercase block">Lucro Médio Diário</span>
            <div className={`my-1 font-mono font-bold text-sm ${metrics.avgDailyProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {metrics.avgDailyProfit >= 0 ? '+' : ''}{metrics.avgDailyProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} U
            </div>
            <span className="text-[8px] text-[#848e9c]">saldo líquido do progresso</span>
          </div>

          {/* Best Day */}
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 text-center flex flex-col justify-between" title={metrics.bestDay}>
            <span className="text-[9px] font-bold text-[#848e9c] uppercase block">Melhor Dia</span>
            <div className="my-1 text-emerald-400 font-mono font-bold text-[10px] truncate max-w-full leading-relaxed">
              {metrics.bestDay.split(' ')[0]}
              <span className="block text-emerald-400 text-xs font-bold font-mono">
                {metrics.bestDay.includes('(') ? metrics.bestDay.split(' ')[1] : ''}
              </span>
            </div>
            <span className="text-[8px] text-[#848e9c]">recorde de ganho diário</span>
          </div>

          {/* Worst Day */}
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 text-center flex flex-col justify-between" title={metrics.worstDay}>
            <span className="text-[9px] font-bold text-[#848e9c] uppercase block">Pior Dia</span>
            <div className="my-1 text-rose-400 font-mono font-bold text-[10px] truncate max-w-full leading-relaxed">
              {metrics.worstDay.split(' ')[0]}
              <span className="block text-rose-400 text-xs font-bold font-mono">
                {metrics.worstDay.includes('(') ? metrics.worstDay.split(' ')[1] : ''}
              </span>
            </div>
            <span className="text-[8px] text-[#848e9c]">maior prejuízo diário</span>
          </div>
        </div>
      </div>
    </div>
  );
}
