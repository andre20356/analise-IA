import React from 'react';
import { Terminal, Shield, Trash2, HelpCircle } from 'lucide-react';
import { SystemLog } from '../types';

interface LogViewerProps {
  logs: SystemLog[];
  onClearLogs: () => void;
}

export default function LogViewer({ logs, onClearLogs }: LogViewerProps) {
  return (
    <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 border-b border-[#2b2f36] pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Logs do Sistema & IA</h3>
        </div>
        <button
          onClick={onClearLogs}
          className="text-[#848e9c] hover:text-red-400 hover:bg-[#1e2329] p-1 rounded border border-[#2b2f36] transition-all cursor-pointer flex items-center justify-center"
          title="Limpar logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-2.5 flex-1 h-[200px] overflow-y-auto font-mono text-[10px] leading-relaxed space-y-1.5 scrollbar-thin">
        {logs.length === 0 ? (
          <div className="text-[#848e9c] italic h-full flex items-center justify-center">
            Sem logs registrados no momento.
          </div>
        ) : (
          logs.map((log) => {
            let typeColor = 'text-[#848e9c]';
            let typeLabel = '[SYS]';

            switch (log.type) {
              case 'connection':
                typeColor = 'text-amber-400';
                typeLabel = '[CONN]';
                break;
              case 'api':
                typeColor = 'text-blue-400';
                typeLabel = '[API]';
                break;
              case 'ai':
                typeColor = 'text-blue-300 font-bold';
                typeLabel = '[GEMINI]';
                break;
              case 'trade':
                typeColor = 'text-brand-green font-bold';
                typeLabel = '[TRADE]';
                break;
              case 'error':
                typeColor = 'text-red-400 font-bold';
                typeLabel = '[ERROR]';
                break;
              default:
                typeColor = 'text-brand-muted';
                typeLabel = '[SYSTEM]';
            }

            return (
              <div key={log.id} className="hover:bg-[#1e2329]/50 p-0.5 rounded transition-colors text-slate-300 flex items-start gap-1">
                <span className="text-[#848e9c] shrink-0 select-none">
                  [{new Date(log.timestamp).toLocaleTimeString('pt-BR')}]
                </span>
                <span className={`${typeColor} shrink-0 select-none mr-1`}>
                  {typeLabel}
                </span>
                <span className="break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#848e9c] uppercase">
        <Shield className="w-3.5 h-3.5 text-blue-400" />
        <span>Todos os eventos e decisões do Gemini 3.5 são auditados em tempo real.</span>
      </div>
    </div>
  );
}
