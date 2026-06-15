import React, { useMemo } from 'react';
import { BalancePoint } from '../types';
import { TrendingUp, DollarSign } from 'lucide-react';

interface BalanceChartProps {
  history: BalancePoint[];
  startingCapital: number;
}

export default function BalanceChart({ history, startingCapital }: BalanceChartProps) {
  const points = useMemo(() => {
    // Ensure we have at least some dummy points if history is empty
    if (!history || history.length === 0) {
      return [{ timestamp: new Date().toISOString(), balance: startingCapital }];
    }
    return history;
  }, [history, startingCapital]);

  // Compute graph bounds
  const stats = useMemo(() => {
    const balances = points.map(p => p.balance);
    const max = Math.max(...balances, startingCapital) * 1.02;     // Pad 2% on top
    const min = Math.min(...balances, startingCapital) * 0.98;     // Draw slightly below
    const range = max - min || 1;
    return { min, max, range };
  }, [points, startingCapital]);

  // Dimensions of SVG inside canvas
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const width = 500;
  const height = 180;

  // Convert coordinate points to coordinates in SVG viewbox (0,0 to width, height)
  const svgPoints = useMemo(() => {
    if (points.length === 1) {
      // Draw a horizontal line if only one data point exists
      const y = padding.top + (height - padding.top - padding.bottom) / 2;
      return [
        { x: padding.left, y, balance: points[0].balance, label: "" },
        { x: width - padding.right, y, balance: points[0].balance, label: "" }
      ];
    }

    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;

    return points.map((p, i) => {
      const x = padding.left + (i / (points.length - 1)) * usableWidth;
      const y = padding.top + usableHeight - ((p.balance - stats.min) / stats.range) * usableHeight;
      const date = new Date(p.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { x, y, balance: p.balance, label: date };
    });
  }, [points, stats, height, width]);

  // SVG Path generator and helper
  const linePath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    return svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [svgPoints]);

  const areaPath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    const first = svgPoints[0];
    const last = svgPoints[svgPoints.length - 1];
    const bottomY = height - padding.bottom;
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [svgPoints, linePath, height, padding.bottom]);

  // Current balance vs starting comparison
  const currentBalance = points[points.length - 1]?.balance || startingCapital;
  const absolutePnL = currentBalance - startingCapital;
  const relativePnL = (absolutePnL / startingCapital) * 105; // factored percentage representation

  return (
    <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Evolução do Saldo</h3>
          </div>

          <div className="text-right">
            <span className={`text-xs font-bold font-mono ${absolutePnL >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
              {absolutePnL >= 0 ? '+' : ''}{absolutePnL.toFixed(2)} USDT ({((currentBalance - startingCapital) / startingCapital * 100).toFixed(2)}%)
            </span>
            <span className="block text-[8px] text-[#848e9c] uppercase tracking-wider font-extrabold font-mono">PnL Virtual Total</span>
          </div>
        </div>

        {/* Dynamic SVG Plotting */}
        <div className="relative w-full overflow-hidden mt-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto text-[#848e9c] overflow-visible"
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = padding.top + ratio * (height - padding.top - padding.bottom);
              const gridVal = stats.max - ratio * stats.range;
              return (
                <g key={idx}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    className="stroke-[#2b2f36]"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    className="fill-[#848e9c] font-mono text-[8px] font-semibold text-right"
                    textAnchor="end"
                  >
                    {gridVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Trend curve Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]"
            />

            {/* Starting Balance baseline indicator */}
            {(() => {
              const baseUsableHeight = height - padding.top - padding.bottom;
              const baseY = padding.top + baseUsableHeight - ((startingCapital - stats.min) / stats.range) * baseUsableHeight;
              
              if (baseY >= padding.top && baseY <= height - padding.bottom) {
                return (
                  <line
                    x1={padding.left}
                    y1={baseY}
                    x2={width - padding.right}
                    y2={baseY}
                    className="stroke-[#2b2f36]/60"
                    strokeWidth="1.2"
                  />
                );
              }
              return null;
            })()}

            {/* Points and Tooltips */}
            {svgPoints.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  className="fill-blue-500 stroke-[#0b0e11] group-hover:r-4 transition-all"
                  strokeWidth="1.5"
                />

                {/* Micro hovering tooltips */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  {/* Tooltip box */}
                  <rect
                    x={p.x - 45}
                    y={p.y - 35}
                    width="90"
                    height="28"
                    rx="4"
                    className="fill-[#0b0e11] stroke-[#2b2f36] filter drop-shadow-md"
                    strokeWidth="1"
                  />
                  {/* Text balance */}
                  <text
                    x={p.x}
                    y={p.y - 24}
                    textAnchor="middle"
                    className="fill-blue-300 font-mono text-[9px] font-bold"
                  >
                    {p.balance.toFixed(2)} USDT
                  </text>
                  <text
                    x={p.x}
                    y={p.y - 14}
                    textAnchor="middle"
                    className="fill-[#848e9c] font-mono text-[7px]"
                  >
                    {p.label || 'Início'}
                  </text>
                </g>
              </g>
            ))}

            {/* Bottom time Labels */}
            {svgPoints.length > 1 && (
              <g>
                <text
                  x={padding.left}
                  y={height - 10}
                  className="fill-[#848e9c] font-mono text-[8px] font-bold"
                  textAnchor="start"
                >
                  {svgPoints[0].label || 'Início'}
                </text>
                <text
                  x={width - padding.right}
                  y={height - 10}
                  className="fill-[#848e9c] font-mono text-[8px] font-bold"
                  textAnchor="end"
                >
                  {svgPoints[svgPoints.length - 1].label}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="text-[10px] text-[#848e9c] flex justify-between pt-1 border-t border-[#2b2f36]/60">
        <span>Capital Inicial: {startingCapital} USDT</span>
        <span>Simulação Virtual Ativa</span>
      </div>
    </div>
  );
}
