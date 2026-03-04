import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, ExternalLink } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { statusConfig, cn } from '../../utils/helpers';

function ProjectMiniCard({ project }) {
  const status = statusConfig[project.status];
  return (
    <Link
      to={`/proyecto/${project.id}`}
      className="block p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{project.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.shortDescription}</p>
        </div>
        <span className={cn(status?.className, 'shrink-0 text-xs')}>
          {status?.label}
        </span>
      </div>
      {project.department && (
        <p className="text-xs text-gray-400 mt-1">{project.department.name}</p>
      )}
    </Link>
  );
}

function Message({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 whitespace-pre-wrap">
          {/* Render markdown-style links */}
          {msg.content.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <Link
                  key={i}
                  to={match[2]}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {match[1]}
                </Link>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>

        {/* Project cards */}
        {msg.projects?.length > 0 && (
          <div className="mt-2 space-y-2">
            {msg.projects.map(p => (
              <ProjectMiniCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const QUICK_QUESTIONS = [
  '¿Qué proyectos están en producción?',
  '¿Hay herramientas de cobranza?',
  '¿Qué usa el equipo de RRHH?',
];

export default function AriaFloating() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  // Don't show on /aria page
  if (location.pathname === '/aria') return null;

  const mutation = useMutation({
    mutationFn: ({ message, convId }) =>
      api.post('/aria/chat', { message, conversationId: convId }),
    onSuccess: (response) => {
      const { response: text, projects, conversationId: newConvId } = response.data;
      setConversationId(newConvId);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: text, projects },
      ]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, tuve un error. Por favor intenta de nuevo.', projects: [] },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    mutation.mutate({ message: msg, convId: conversationId });
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy ARIA 👋\n\n¿En qué puedo ayudarte? Puedo buscar proyectos de AI en Numaris, ayudarte a encontrar herramientas o responder preguntas sobre las iniciativas de automatización.',
        projects: [],
      }]);
    }
  };

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50"
          title="Pregúntale a ARIA"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            'fixed right-6 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 transition-all flex flex-col',
            minimized
              ? 'bottom-6 w-72 h-14'
              : 'bottom-6 w-96 h-[520px] max-h-[80vh]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-2xl text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">ARIA</p>
                {!minimized && <p className="text-xs text-white/70">AI Repository Intelligent Assistant</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <Message key={i} msg={msg} />
                ))}

                {mutation.isPending && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick questions */}
                {messages.length === 1 && !mutation.isPending && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 font-medium">Preguntas rápidas:</p>
                    {QUICK_QUESTIONS.map(q => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="block w-full text-left text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregúntale algo a ARIA..."
                    className="input flex-1 text-sm py-2"
                    disabled={mutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || mutation.isPending}
                    className="btn-primary px-3 py-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  ARIA busca en la base de datos de proyectos de Numaris
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
