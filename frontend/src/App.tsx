import { useState, useEffect } from 'react';

interface Model {
  name: string;
}

interface Template {
  id: number;
  title: string;
  system_prompt: string;
  user_prompt: string;
}

export default function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('You are a helpful AI assistant.');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateTitle, setTemplateTitle] = useState<string>('');

  const API_BASE = 'http://localhost:8000/api';

  useEffect(() => {
    fetchModels();
    fetchTemplates();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setSelectedModel(data.models[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch Ollama models. Is Ollama running?', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/templates`);
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !userPrompt) return;

    setLoading(true);
    setResponse('');

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: userPrompt,
          system: systemPrompt,
          temperature: temperature,
        }),
      });
      const data = await res.json();
      setResponse(data.response || 'No response returned.');
    } catch (err) {
      setResponse('Error: Failed to generate response from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle || !userPrompt) return;
    try {
      await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: templateTitle,
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
        }),
      });
      setTemplateTitle('');
      fetchTemplates();
    } catch (err) {
      console.error('Failed to save template', err);
    }
  };

  const loadTemplate = (t: Template) => {
    setSystemPrompt(t.system_prompt);
    setUserPrompt(t.user_prompt);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wider text-emerald-400">⚡ PromptPlayground</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Model:</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Prompt Inputs & Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <form onSubmit={handleGenerate} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-200">Configuration</h2>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">System Prompt</label>
              <textarea 
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">User Prompt</label>
              <textarea 
                rows={5}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter prompt here..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-gray-400 mb-1">
                <span>Temperature</span>
                <span>{temperature}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Send Prompt'}
            </button>
          </form>

          {/* Template Saver */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 shadow-lg">
            <h2 className="text-md font-semibold text-gray-200">Save Template</h2>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Template Title"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
              />
              <button 
                type="button"
                onClick={handleSaveTemplate}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-1.5 rounded-lg text-sm transition-colors border border-gray-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Templates History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Response Output Box */}
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col shadow-lg min-h-[300px]">
            <h2 className="text-lg font-semibold text-gray-200 mb-3">Model Response</h2>
            <div className="flex-1 bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
              {loading ? (
                <span className="text-emerald-400 animate-pulse">Thinking...</span>
              ) : (
                response || 'Response will appear here...'
              )}
            </div>
          </div>

          {/* Saved Templates List */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-md font-semibold text-gray-200 mb-3">Saved Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500">No saved templates yet.</p>
              ) : (
                templates.map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => loadTemplate(t)}
                    className="bg-gray-950 border border-gray-800 hover:border-emerald-600/50 rounded-lg p-3 cursor-pointer transition-all flex flex-col justify-between gap-2"
                  >
                    <span className="font-semibold text-sm text-emerald-400 truncate">{t.title}</span>
                    <p className="text-xs text-gray-400 line-clamp-1">{t.user_prompt}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
