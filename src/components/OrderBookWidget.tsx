import React from 'react';
import { ArrowUpRight, ArrowDownRight, Layers2, Activity } from 'lucide-react';
import { OrderBook, Trade } from '../types';

interface OrderBookWidgetProps {
  orderBook: OrderBook;
  recentTrades: Trade[];
  price: number;
  change: number;
}

export default function OrderBookWidget({
  orderBook,
  recentTrades,
  price,
  change
}: OrderBookWidgetProps) {
  // Compute max totals to scale depth bars correctly
  const maxBidQty = Math.max(...orderBook.bids.map(b => b.quantity), 0.001);
  const maxAskQty = Math.max(...orderBook.asks.map(a => a.quantity), 0.001);

  return (
    <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-3 border-b border-[#2b2f36] pb-2">
          <Layers2 className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Livro de Ofertas & Fluxo</h3>
        </div>

        {/* Current price spread indicator */}
        <div className="text-center bg-[#0b0e11] rounded py-2 border border-[#2b2f36] mb-3">
          <span className="text-[9px] font-bold text-[#848e9c] block uppercase tracking-wider">PREÇO ATUAL BINANCE</span>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className={`text-lg font-mono font-bold tracking-tight ${change >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
              {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
            <span className={`text-[10px] font-mono font-bold px-1 rounded ${change >= 0 ? 'bg-green-900/40 text-[#00c076]' : 'bg-red-950/40 text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Depth Grid (Asks on Top, Bids on Bottom or side-by-side) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#848e9c] block mb-1.5 uppercase tracking-wide">COMPRAS (BIDS)</span>
            <div className="space-y-1 font-mono text-[10px]">
              {orderBook.bids.slice(0, 7).map((bid, i) => {
                const pct = (bid.quantity / maxBidQty) * 100;
                return (
                  <div key={i} className="relative flex justify-between items-center py-0.5 px-0.5">
                    <div
                      style={{ width: `${pct}%` }}
                      className="absolute left-0 top-0 bottom-0 bg-brand-green/10 rounded-r transition-all"
                    />
                    <span className="text-brand-green font-bold z-10 font-mono">
                      {bid.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[#eaecef]/80 z-10">
                      {bid.quantity.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#848e9c] block mb-1.5 uppercase tracking-wide">VENDAS (ASKS)</span>
            <div className="space-y-1 font-mono text-[10px]">
              {orderBook.asks.slice(0, 7).map((ask, i) => {
                const pct = (ask.quantity / maxAskQty) * 100;
                return (
                  <div key={i} className="relative flex justify-between items-center py-0.5 px-0.5">
                    <div
                      style={{ width: `${pct}%` }}
                      className="absolute right-0 top-0 bottom-0 bg-red-500/10 rounded-l transition-all"
                    />
                    <span className="text-red-400 font-bold z-10 font-mono">
                      {ask.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[#eaecef]/80 z-10">
                      {ask.quantity.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Trades flow */}
        <div className="mt-4 pt-3 border-t border-[#2b2f36]">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-[#848e9c]" />
            <span className="text-[10px] font-bold text-[#848e9c] uppercase tracking-wider">Trades Recentes (Binance)</span>
          </div>

          <div className="grid grid-cols-3 text-[9px] font-bold text-[#848e9c] uppercase pb-1 border-b border-[#2b2f36]">
            <span>Preço</span>
            <span className="text-right">Qtd</span>
            <span className="text-right">Horário</span>
          </div>

          <div className="space-y-1 pt-1 font-mono text-[10px]">
            {recentTrades.slice(0, 5).map((t, i) => (
              <div key={i} className="grid grid-cols-3 hover:bg-[#0b0e11]/40 py-0.5 px-0.5">
                <span className={`font-bold flex items-center ${t.isBuyerMaker ? 'text-red-400' : 'text-brand-green'}`}>
                  {t.isBuyerMaker ? (
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[#eaecef]/80 text-right">
                  {t.quantity.toFixed(4)}
                </span>
                <span className="text-[#848e9c] text-right">
                  {new Date(t.time).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
