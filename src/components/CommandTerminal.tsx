import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Play, Pause, ChevronRight, HelpCircle, Activity, Settings, RotateCcw } from 'lucide-react';
import { UserConfig, SimulatedTrade } from '../types';

interface CommandTerminalProps {
  config: UserConfig;
  onStateUpdate: (newState: any) => void;
  trades: SimulatedTrade[];
}

export default function CommandTerminal({
  config,
  onStateUpdate,
  trades
}: CommandTerminalProps) {
  const [commandInput, setCommandInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string>('AGUARDANDO COMANDO');
  const [executing, setExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  const presets = [
    'ANALISAR MERCADO',
    'GERAR OPORTUNIDADES',
    'STATUS GERAL',
    'STATUS PORTFOLIO',
    'ATUALIZAR META 150',
    'ATUALIZAR RISCO 1.5',
    'ATUALIZAR LIMITE_OPERACOES 8',
    'ATIVAR MODO AUTO',
    'ATIVAR MODO ANALISE',
    'PAUSAR SISTEMA',
    'RETOMAR SISTEMA',
    'RELATORIO DO DIA',
    'RELATORIO SEMANAL',
    'RELATORIO MENSAL',
    'BACKTEST ESTRATEGIA',
    'OTIMIZAR ESTRATEGIAS',
    'KILL'
  ];

  const handleExecuteCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    setExecuting(true);
    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: cmdText })
      });
      const data = await response.json();
      if (data.success) {
        setTerminalOutput(data.outputText);
        if (data.updatedState) {
          onStateUpdate(data.updatedState);
        }
      } else {
        setTerminalOutput(`ERRO AO EXECUTAR COMANDO:\n${data.error || 'Falha na resposta do servidor'}`);
      }
    } catch (err: any) {
      setTerminalOutput(`FALHA DE REDE OU COMUNICAÇÃO:\n${err.message || 'Erro desconhecido'}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteCommand(commandInput);
    setCommandInput('');
  };

  const parseOutput = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    let currentKey = '';
    const parsed: { [key: string]: string } = {};

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.endsWith(':')) {
        currentKey = trimmed.replace(':', '');
      } else if (currentKey) {
        parsed[currentKey] = trimmed;
        currentKey = '';
      }
    });
    return parsed;
  };

  const parsedData = parseOutput(terminalOutput);

  return (
    <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md flex flex-col justify-between h-full" id="command-terminal-box">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-[#2b2f36] pb-2.5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">IA AUTÔNOMA – COMMAND ENGINE V2</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Modo: {config.aiModeState || 'SEMI_AUTO'}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
              config.aiPaused 
                ? 'bg-rose-950/40 text-rose-400 border border-rose-500/10' 
                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10'
            }`}>
              {config.aiPaused ? 'PAUSADO' : 'ATIVO'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#848e9c] mb-3 leading-relaxed">
          Envie comandos em linguagem natural ou clique nos botões rápidos para controlar o status, atualizar metas de forma automática ou solicitar sinal preditivo instantâneo.
        </p>

        {/* Quick Presets Grid */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-[#848e9c] uppercase block mb-1.5 tracking-wider">Comandos Rápidos</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCommandInput(p);
                  handleExecuteCommand(p);
                }}
                disabled={executing}
                className="bg-[#1e2329] border border-[#2b2f36] hover:border-amber-500/60 hover:bg-[#2b2f36] transition-all duration-150 rounded px-2.5 py-1 text-[10px] font-mono text-[#eaecef] uppercase cursor-pointer disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Console Display Screen */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-[#848e9c] uppercase block mb-1.5 tracking-wider">Terminal do Sistema</span>
          
          <div className="bg-[#0b0e11] border border-[#2b2f36] rounded p-3 font-mono text-[11px] text-zinc-300 min-h-[190px] flex flex-col justify-between shadow-inner">
            
            {executing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-amber-500">
                <span className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Processando Comando...</span>
              </div>
            ) : terminalOutput === 'AGUARDANDO COMANDO' ? (
              <div className="flex flex-col items-center justify-center text-center py-12 text-[#848e9c]">
                <HelpCircle className="w-8 h-8 mb-2 opacity-35" />
                <span className="font-bold text-[11px] tracking-wide text-zinc-400">STATUS: AGUARDANDO COMANDO</span>
                <p className="text-[10px] mt-1 text-[#848e9c]/80">O motor do robô está aguardando diretrizes</p>
              </div>
            ) : (
              <div className="whitespace-pre-line leading-relaxed overflow-x-auto select-text scrollbar-thin max-h-[300px]">
                {/* Format key-values for extra premium UI aesthetic */}
                {terminalOutput.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  
                  const isLabel = [
                    'COMANDO:', 'STATUS:', 'MODO:', 'CAPITAL TOTAL:', 'CAPITAL EM USO:', 
                    'META DIARIA:', 'OPERACOES HOJE:', 'ATIVOS ANALISADOS:', 
                    'MELHORES OPORTUNIDADES:', 'SCORE FINAL:', 'RISCO:', 'EXPOSICAO:', 
                    'DRAWDOWN:', 'LUCRO ACUMULADO:', 'JUSTIFICATIVA:', 'PROXIMA ACAO:', 
                    'HORARIO DA ANALISE:', 'ESTRATÉGIAS ATIVAS:', 'ENTRADA:', 'STOP LOSS:', 'TAKE PROFIT:', 
                    'EXPOSIÇÃO TOTAL:', 'DRAWDOWN ATUAL:', 'PORTFÓLIO:', 'PRÓXIMA REAVALIAÇÃO:',
                    'ATIVO:', 'TENDÊNCIA:', 'AÇÃO:', 'CONFIANÇA:', 'ENTRADAS HOJE:', 'LUCRO DO DIA:', 'PRÓXIMA AÇÃO:'
                  ].includes(trimmed);

                  if (isLabel) {
                    return (
                      <span key={i} className="text-[#f0a030] font-bold block mt-2 text-[10px] uppercase tracking-wider border-l border-amber-500/50 pl-2 bg-amber-500/5 py-0.5 rounded-sm">
                        {trimmed}
                      </span>
                    );
                  }
                  
                  if (trimmed === 'COMPRA') {
                    return <span key={i} className="inline-block px-1.5 py-0.5 rounded font-black text-white bg-emerald-900 border border-emerald-500/20 text-[10px] mt-0.5">{trimmed}</span>;
                  }
                  if (trimmed === 'VENDA') {
                    return <span key={i} className="inline-block px-1.5 py-0.5 rounded font-black text-white bg-rose-950 border border-rose-500/20 text-[10px] mt-0.5">{trimmed}</span>;
                  }
                  if (trimmed === 'AGUARDAR' || trimmed === 'Aguardar') {
                    return <span key={i} className="inline-block px-1.5 py-0.5 rounded font-bold text-[#848e9c] bg-[#1e2329] border border-[#2b2f36] text-[10px] mt-0.5">{trimmed}</span>;
                  }
                  if (trimmed === 'Alta') {
                    return <span key={i} className="font-bold text-emerald-400">{trimmed}</span>;
                  }
                  if (trimmed === 'Baixa') {
                    return <span key={i} className="font-bold text-rose-400">{trimmed}</span>;
                  }
                  if (trimmed === 'Lateral') {
                    return <span key={i} className="font-bold text-zinc-400">{trimmed}</span>;
                  }
                  if (trimmed === 'ATIVO') {
                    return <span key={i} className="font-bold text-emerald-400">{trimmed}</span>;
                  }
                  if (trimmed === 'PAUSADO') {
                    return <span key={i} className="font-bold text-rose-400">{trimmed}</span>;
                  }
                  if (trimmed === 'META ATINGIDA') {
                    return <span key={i} className="font-black text-amber-400 animate-pulse">{trimmed}</span>;
                  }
                  if (trimmed === 'AUTO' || trimmed === 'SEMI_AUTO' || trimmed === 'ANALYTIC') {
                    let cNames = "font-black text-xs font-mono ";
                    if (trimmed === 'AUTO') cNames += "text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20";
                    if (trimmed === 'SEMI_AUTO') cNames += "text-sky-400 bg-sky-400/10 px-1 py-0.5 rounded border border-sky-400/20";
                    if (trimmed === 'ANALYTIC') cNames += "text-violet-400 bg-violet-400/10 px-1 py-0.5 rounded border border-violet-400/20";
                    return <span key={i} className={cNames}>{trimmed}</span>;
                  }

                  return <span key={i} className="text-[#eaecef] block ml-1 text-xs">{line}</span>;
                })}
              </div>
            )}

            <div className="mt-3.5 pt-2.5 border-t border-[#2b2f36]/40 flex items-center justify-between text-[9px] text-[#848e9c] uppercase">
              <span className="flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />
                IA Shell v1.02_Secure
              </span>
              <span>100% Autônomo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input bar submission form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2 relative mt-1">
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="Digite um comando..."
          disabled={executing}
          className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded pl-3 pr-10 py-2 text-xs text-[#eaecef] font-mono focus:outline-none focus:border-amber-500 placeholder-[#474d57] shadow-inner"
        />
        <button
          type="submit"
          disabled={executing || !commandInput.trim()}
          className="absolute right-1 top-1 p-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:hover:bg-amber-500 text-[#0b0e11] rounded cursor-pointer transition-colors duration-150"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
