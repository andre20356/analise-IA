import React from 'react';
import { SimulatedTrade } from '../types';
import { History, Play, CheckCircle2, TrendingUp, TrendingDown, Hourglass, XCircle, AlertCircle } from 'lucide-react';

interface TradesTableProps {
  trades: SimulatedTrade[];
  onManualClose: (tradeId: string) => void;
  currentPrice: number;
}

export default function TradesTable({ trades, onManualClose, currentPrice }: TradesTableProps) {
  return (
    <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-sm" id="trades-table-panel">
      <div className="flex items-center gap-2 mb-3 border-b border-[#2b2f36] pb-2">
        <History className="w-4 h-4 text-blue-400" />
        <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Histórico de Operações</h3>
      </div>

      {trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-[#0b0e11]/40 border border-dashed border-[#2b2f36] rounded">
          <AlertCircle className="w-8 h-8 text-[#848e9c]/60 mb-2" />
          <h4 className="text-xs font-bold text-[#848e9c] uppercase">Nenhuma operação virtual realizada</h4>
          <p className="text-[11px] text-[#848e9c]/70 max-w-xs mt-1 leading-relaxed px-4">
            Execute previsões de IA com Gemini e quando recomendarem COMPRA ou VENDA, posições de simulação serão registradas imediatamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-[#848e9c] border-b border-[#2b2f36] uppercase tracking-wider font-bold text-[9px] bg-[#0b0e11]">
                <th className="py-2.5 px-3">Ativo</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Entrada</th>
                <th className="py-2.5 px-3 text-right">Aporte (USDT)</th>
                <th className="py-2.5 px-3 text-right">Saída</th>
                <th className="py-2.5 px-3 text-right">Resultado</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b2f36] font-medium text-[#eaecef]">
              {trades.map((trade) => {
                const isProfit = trade.profitPct && trade.profitPct >= 0;

                return (
                  <tr key={trade.id} className="hover:bg-[#0b0e11]/50 transition-colors">
                    <td className="py-2 px-3 font-semibold text-white font-mono text-[11px]">
                      {trade.asset}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        trade.type === 'COMPRA' ? 'text-brand-green' : 'text-red-400'
                      }`}>
                        {trade.type === 'COMPRA' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {trade.type}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        trade.status === 'OPEN'
                          ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                          : 'bg-[#1e2329]/50 text-[#848e9c] border border-[#2b2f36]'
                      }`}>
                        {trade.status === 'OPEN' && <Hourglass className="w-2.5 h-2.5 animate-spin" />}
                        {trade.status === 'CLOSED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {trade.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-xs">
                      {trade.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="block text-[8px] text-[#848e9c] font-normal">
                        SL: {trade.stopLoss ? trade.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'} | TP: {trade.takeProfit ? trade.takeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-xs">
                      {trade.investedCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <span className="block text-[8px] text-[#848e9c] font-normal">
                        ({trade.sizePct}%)
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-xs">
                      {trade.exitPrice
                        ? trade.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
                        : '-'}
                      {trade.exitTime && (
                        <span className="block text-[8px] text-[#848e9c] font-normal">
                          {trade.durationMs 
                            ? `Duração: ${Math.round(trade.durationMs / 1000)}s` 
                            : new Date(trade.exitTime).toLocaleTimeString('pt-BR')}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {trade.status === 'CLOSED' ? (
                        <div className="font-mono text-xs">
                          <span className={isProfit ? 'text-brand-green font-bold' : 'text-red-400 font-bold'}>
                            {isProfit ? '+' : ''}
                            {trade.profitCapital?.toLocaleString('en-US', { minimumFractionDigits: 2 })} U
                          </span>
                          <span className={`block text-[9px] font-bold ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                            {trade.exitReason ? trade.exitReason : `${isProfit ? '+' : ''}${trade.profitPct}%`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-bold font-mono text-[10px] animate-pulse">
                          NEGOCIANDO
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {trade.status === 'OPEN' ? (
                        <button
                          onClick={() => onManualClose(trade.id)}
                          className="bg-[#1e2329] hover:bg-[#2b2f36] hover:text-red-400 border border-[#474d57] text-[#eaecef] px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer"
                        >
                          Fechar Posição
                        </button>
                      ) : (
                        <span className="text-[9px] text-[#848e9c] font-bold uppercase bg-[#0b0e11] border border-[#2b2f36] px-1.5 py-0.5 rounded select-none">
                          Finalizado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
