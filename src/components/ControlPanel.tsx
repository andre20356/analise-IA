import React, { useState, useEffect } from 'react';
import { Key, Play, RefreshCw, Layers, DollarSign, Percent, Wifi, AlertCircle, ShieldAlert, ShieldCheck, Brain } from 'lucide-react';
import { UserConfig, ConnectionStatus } from '../types';

interface ControlPanelProps {
  config: UserConfig;
  onSaveKeys: (apiKey: string, secretKey: string) => Promise<void>;
  onTestConnection: () => Promise<void>;
  onUpdateConfig: (updated: Partial<UserConfig>) => Promise<void>;
  testingConnection: boolean;
  onResetSimulation: () => Promise<void>;
}

export default function ControlPanel({
  config,
  onSaveKeys,
  onTestConnection,
  onUpdateConfig,
  testingConnection,
  onResetSimulation
}: ControlPanelProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [keysSavedMessage, setKeysSavedMessage] = useState(false);
  const [capitalInput, setCapitalInput] = useState(config.virtualCapital.toString());
  const [percentInput, setPercentInput] = useState(config.percentPerOperation.toString());
  const [stopLossInput, setStopLossInput] = useState((config.stopLossPct ?? 2.0).toString());
  const [takeProfitInput, setTakeProfitInput] = useState((config.takeProfitPct ?? 3.0).toString());
  const [aiApiKeyInput, setAiApiKeyInput] = useState(config.aiApiKey || '');
  const [aiModelInput, setAiModelInput] = useState(config.aiModel || 'gemini-3.5-flash');
  const [aiProviderInput, setAiProviderInput] = useState(config.aiProvider || 'gemini');
  const [aiCustomUrlInput, setAiCustomUrlInput] = useState(config.aiCustomUrl || '');
  const [aiSavedMessage, setAiSavedMessage] = useState(false);
  const [symbols] = useState(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'DOGE/USDT']);
  const [maxDailyTradesInput, setMaxDailyTradesInput] = useState((config.maxDailyTrades ?? 5).toString());

  useEffect(() => {
    setCapitalInput(config.virtualCapital.toString());
    setPercentInput(config.percentPerOperation.toString());
    setStopLossInput((config.stopLossPct ?? 2.0).toString());
    setTakeProfitInput((config.takeProfitPct ?? 3.0).toString());
    setAiApiKeyInput(config.aiApiKey || '');
    setAiModelInput(config.aiModel || 'gemini-3.5-flash');
    setAiProviderInput(config.aiProvider || 'gemini');
    setAiCustomUrlInput(config.aiCustomUrl || '');
    setMaxDailyTradesInput((config.maxDailyTrades ?? 5).toString());
  }, [config.virtualCapital, config.percentPerOperation, config.stopLossPct, config.takeProfitPct, config.aiApiKey, config.aiModel, config.aiProvider, config.aiCustomUrl, config.maxDailyTrades]);

  const handleKeysSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveKeys(apiKeyInput, secretKeyInput);
    setKeysSavedMessage(true);
    setApiKeyInput('');
    setSecretKeyInput('');
    setTimeout(() => setKeysSavedMessage(false), 3000);
  };

  const handleParamsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      virtualCapital: parseFloat(capitalInput) || 1000,
      percentPerOperation: parseFloat(percentInput) || 10,
      stopLossPct: parseFloat(stopLossInput) || 2.0,
      takeProfitPct: parseFloat(takeProfitInput) || 3.0,
      maxDailyTrades: parseInt(maxDailyTradesInput) || 5
    });
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      aiApiKey: aiApiKeyInput,
      aiModel: aiModelInput,
      aiProvider: aiProviderInput as any,
      aiCustomUrl: aiCustomUrlInput
    });
    setAiSavedMessage(true);
    setTimeout(() => setAiSavedMessage(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Bybit Authentication box */}
      <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md" id="control-panel-keys">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#f0b90b]" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Conexão Bybit</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
            config.connectedStatus === 'Conectado' || config.connectedStatus === 'Conectado (Simulado)'
              ? 'bg-green-900/40 text-green-400 border border-green-500/20'
              : config.connectedStatus === 'Erro de autenticação'
              ? 'bg-red-950/40 text-red-400 border border-red-500/20'
              : 'bg-[#1e2329]/50 text-[#848e9c] border border-[#2b2f36]'
          }`}>
            <Wifi className="w-3 h-3 animate-pulse" />
            {config.connectedStatus}
          </span>
        </div>

        <p className="text-[11px] text-[#848e9c] mb-3 leading-relaxed">
          Para verificação completa, insira suas credenciais da Bybit. Para análise pública em tempo real, as chaves não são obrigatórias — o sinalizador operará em modo virtual simulado normalmente!
        </p>

        <form onSubmit={handleKeysSubmit} className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1">Bybit API Key</label>
            <input
              type="password"
              placeholder="Inserir Bybit API Key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1.5 text-xs text-[#eaecef] placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1">Bybit Secret Key</label>
            <input
              type="password"
              placeholder="Inserir Bybit Secret Key"
              value={secretKeyInput}
              onChange={(e) => setSecretKeyInput(e.target.value)}
              className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1.5 text-xs text-[#eaecef] placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-[#1e2329] hover:bg-[#2b2f36] text-[#eaecef] border border-[#474d57] text-xs font-bold py-1.5 px-2 rounded transition-colors cursor-pointer"
            >
              Gravar Chaves
            </button>
            <button
              type="button"
              onClick={onTestConnection}
              disabled={testingConnection}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-1.5 px-2 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Testando...
                </>
              ) : (
                <>Testar Conexão</>
              )}
            </button>
          </div>
        </form>

        {keysSavedMessage && (
          <div className="mt-2.5 p-2 bg-emerald-900/10 border border-brand-green/20 text-[#00c076] rounded text-[10px] flex items-center gap-1.5 animate-fade-in">
            Chaves gravadas com criptografia local com sucesso.
          </div>
        )}
      </div>

      {/* Grid Settings of Virtual capital / parameters */}
      <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md" id="control-panel-settings">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">Parâmetros de Simulação</h3>
          </div>
          <button
              onClick={onResetSimulation}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded font-bold cursor-pointer"
          >
            Resetar Tudo
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1.5 font-mono">Mapear Ativo Bybit</label>
            <div className="flex flex-col gap-1">
              {symbols.map((sym) => (
                <button
                  key={sym}
                  onClick={() => onUpdateConfig({ activeSymbol: sym })}
                  className={`w-full text-left px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer ${
                    config.activeSymbol === sym
                      ? 'bg-amber-500 border-amber-600 text-black shadow-sm'
                      : 'bg-[#0b0e11] border-[#2b2f36] text-[#848e9c] hover:text-[#eaecef]'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleParamsSubmit} className="space-y-2 border-l border-[#2b2f36] pl-3">
            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] mb-1 flex items-center gap-1 uppercase">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Capital Virtual (USDT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={capitalInput}
                  onChange={(e) => setCapitalInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded pl-2.5 pr-6 py-1 text-xs text-[#eaecef] font-mono font-bold focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-2 top-1 text-[#848e9c] text-[10px] font-bold font-mono">U</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] mb-1 flex items-center gap-1 uppercase">
                <Percent className="w-3 h-3 text-blue-400" />
                Aporte por Operação
              </label>
              <select
                value={percentInput}
                onChange={(e) => {
                  setPercentInput(e.target.value);
                  onUpdateConfig({ percentPerOperation: parseFloat(e.target.value) });
                }}
                className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1 text-xs text-[#eaecef] focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="5">5% do Saldo</option>
                <option value="10">10% do Saldo</option>
                <option value="15">15% do Saldo</option>
                <option value="25">25% do Saldo</option>
                <option value="50">50% do Saldo</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] mb-1 flex items-center gap-1 uppercase">
                <Brain className="w-3 h-3 text-purple-400" />
                Modo de Funcionamento (IA)
              </label>
              <select
                value={config.aiModeState || 'SEMI_AUTO'}
                onChange={(e) => {
                  onUpdateConfig({ aiModeState: e.target.value as any });
                }}
                className="w-full bg-[#0b0e11] border border-semibold border-[#2b2f36] rounded px-2 py-1 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 font-bold"
              >
                <option value="ANALYTIC">ANALYTIC (Apenas Relatórios Técnicos)</option>
                <option value="SEMI_AUTO">SEMI_AUTO (Sinal + Execução Manual)</option>
                <option value="AUTO">AUTO (Execução Autônoma Direta)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] mb-1 flex items-center gap-1 uppercase">
                <Play className="w-3 h-3 text-purple-400" />
                Máx. Entradas Diárias (IA Autônoma)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxDailyTradesInput}
                onChange={(e) => setMaxDailyTradesInput(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1 text-xs text-[#eaecef] font-mono font-bold focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-red-400 mb-0.5 uppercase">Stop Loss</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20"
                    value={stopLossInput}
                    onChange={(e) => setStopLossInput(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1 text-xs text-[#eaecef] font-mono font-bold focus:outline-none focus:border-red-500"
                  />
                  <span className="absolute right-1.5 top-1 text-[#848e9c] text-[10px] font-bold font-mono">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-400 mb-0.5 uppercase">Take Profit</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={takeProfitInput}
                    onChange={(e) => setTakeProfitInput(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1 text-xs text-[#eaecef] font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-1.5 top-1 text-[#848e9c] text-[10px] font-bold font-mono">%</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 rounded transition-all cursor-pointer mt-1"
            >
              Salvar Parâmetros
            </button>
          </form>
        </div>

        <div className="mt-2 p-2 w-full bg-[#0b0e11] border border-[#2b2f36] rounded text-[10px] text-[#848e9c] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#848e9c] shrink-0 mt-0.5" />
          <span>
            Cada sinal de COMPRA (+{config.takeProfitPct ?? 3}% TP / -{config.stopLossPct ?? 2}% SL) ou VENDA (-{config.takeProfitPct ?? 3}% TP / +{config.stopLossPct ?? 2}% SL) registrará a quantia do seu saldo virtual de <strong>{config.currentBalance} USDT</strong>.
          </span>
        </div>
      </div>

      {/* AI Engine & API Key custom box */}
      <div className="bg-[#161a1e] border border-[#2b2f36] rounded p-4 shadow-md flex flex-col justify-between" id="control-panel-ai">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-[#eaecef] text-sm uppercase tracking-tight">IA de Análise Multicloud</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border bg-purple-950/40 text-purple-400 border-purple-500/20">
              Personalizado
            </span>
          </div>

          <p className="text-[11px] text-[#848e9c] mb-3 leading-relaxed">
            Configure inteligência artificial para gerar análise técnica em tempo real. Escolha entre Gemini, DeepSeek, ChatGPT, Claude ou endpoints customizados (Ollama/Ngrok).
          </p>

          <form onSubmit={handleAISubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1 font-mono">Provedor de Conectividade</label>
              <select
                value={aiProviderInput}
                onChange={(e) => {
                  const prov = e.target.value;
                  setAiProviderInput(prov);
                  if (prov === 'gemini') {
                    setAiModelInput('gemini-3.5-flash');
                  } else if (prov === 'openai') {
                    setAiModelInput('gpt-4o-mini');
                  } else if (prov === 'deepseek') {
                    setAiModelInput('deepseek-chat');
                  } else if (prov === 'claude') {
                    setAiModelInput('claude-3-5-haiku-latest');
                  } else if (prov === 'custom') {
                    setAiModelInput('llama3');
                  }
                }}
                className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 transition-colors font-bold"
              >
                <option value="gemini">Google Gemini AI</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="claude">Anthropic Claude</option>
                <option value="deepseek">DeepSeek AI</option>
                <option value="custom">Custom API (Ollama / Ngrok / Proxy)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1 font-mono">Chave da API ({aiProviderInput.toUpperCase()})</label>
              <input
                type="password"
                placeholder={config.aiApiKey ? "Sua chave salva (Ocultada)" : `Configurar chave da API ${aiProviderInput.toUpperCase()} (Opcional)`}
                value={aiApiKeyInput}
                onChange={(e) => setAiApiKeyInput(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1.5 text-xs text-[#eaecef] placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors font-mono"
              />
            </div>

            {aiProviderInput === 'custom' && (
              <div>
                <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1 font-mono">URL base customizada (HTTP/Ngrok/Ollama)</label>
                <input
                  type="text"
                  placeholder="Ex: http://localhost:11434/v1/chat/completions"
                  value={aiCustomUrlInput}
                  onChange={(e) => setAiCustomUrlInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1.5 text-xs text-[#eaecef] placeholder-slate-650 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#848e9c] uppercase mb-1 font-mono">Modelo Selecionado</label>
              {aiProviderInput === 'gemini' ? (
                <select
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 transition-colors font-bold"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Ultrarrápido, Recomendado)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Raciocínio Avançado)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Econômico)</option>
                </select>
              ) : aiProviderInput === 'openai' ? (
                <select
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 transition-colors font-bold"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Veloz, Recomendado)</option>
                  <option value="gpt-4o">GPT-4o (Completo e Poderoso)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legado)</option>
                </select>
              ) : aiProviderInput === 'claude' ? (
                <select
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 transition-colors font-bold"
                >
                  <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (Rápido e Preciso)</option>
                  <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (Excelente Raciocínio)</option>
                </select>
              ) : aiProviderInput === 'deepseek' ? (
                <select
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 transition-colors font-bold"
                >
                  <option value="deepseek-chat">DeepSeek V3 (Chat, Custo-benefício)</option>
                  <option value="deepseek-coder">DeepSeek Coder (Análise Avançada)</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Escreva o modelo customizado (Ex: llama3)"
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded px-2.5 py-1.5 text-xs text-[#eaecef] focus:outline-none focus:border-purple-500 transition-colors font-bold"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold py-1.5 rounded transition-colors cursor-pointer"
            >
              Gravar Configuração de IA
            </button>
          </form>

          {aiSavedMessage && (
            <div className="mt-2.5 p-2 bg-emerald-900/10 border border-brand-green/20 text-[#00c076] rounded text-[10px] flex items-center gap-1.5 animate-fade-in">
              Chave e modelo de IA salvos com sucesso.
            </div>
          )}
        </div>

        <div className="mt-3 p-2 bg-[#0b0e11] border border-[#2b2f36] rounded text-[10px] text-purple-400/95 flex items-start gap-1.5">
          <Brain className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Ao utilizar provedores externos (como ChatGPT/Claude/DeepSeek/Ngrok), lembre-se de configurar a respectiva Chave de API.
          </span>
        </div>
      </div>
    </div>
  );
}
