import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, Sparkles, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { statusConfig, cn } from '../utils/helpers';

const SUGGESTED_QUESTIONS = [
  '¿Qué proyectos de automatización existen en cobranza?',
  '¿Hay alguna herramienta para gestionar técnicos?',
  '¿Qué proyectos usa Claude o GPT-4?',
  '¿Qué herramientas de AI se están usando más?',
  '¿Alguien ya automatizó seguimiento de tickets?',
  '¿Qué proyectos están en producción en RRHH?',
];

function ProjectCard({ project }) {
  const status = statusConfig[project.status];
  return (
    <Link
      to={`/proyecto/${project.id}`}
      className="block p-4 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 mb-1">{project.title}</p>
          <p className="text-sm text-gray-500">{project.shortDescription}</p>
        </div>
        {status && <span className={cn(status.className, 'shrink-0')}>{status.label}</span>}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {project.department && (
          <span className="text-xs text-gray-400">{project.department.name}</span>
        )}
        {project.tools?.slice(0, 3).map(t => (
          <span key={t.id || t.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {t.name}
          </span>
        ))}
      </div>
    </Link>
  );
}

function Message({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[70%] bg-primary-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 text-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 max-w-[80%]">
        <p className="text-xs font-semibold text-primary-600 mb-1">ARIA</p>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-3 text-sm text-gray-800 whitespace-pre-wrap">
          {msg.content.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
              return (
                <Link key={i} to={match[2]} className="text-primary-600 hover:underline font-medium">
                  {match[1]}
                </Link>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>

        {msg.projects?.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-400 font-medium">Proyectos encontrados:</p>
            {msg.projects.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AriaPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const mutation = useMutation({
    mutationFn: ({ message, convId }) =>
      api.post('/aria/chat', { message, conversationId: convId }),
    onSuccess: (response) => {
      const { response: text, projects, conversationId: newConvId } = response.data;
      setConversationId(newConvId);
      setMessages(prev => [...prev, { role: 'assistant', content: text, projects }]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, tuve un error procesando tu consulta. Por favor intenta de nuevo.', projects: [] },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg || mutation.isPending) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    mutation.mutate({ message: msg, convId: conversationId });
  };

  const handleClear = () => {
    setMessages([]);
    setConversationId(null);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="text-center py-6 shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ARIA</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI Repository Intelligent Assistant — Busca proyectos en lenguaje natural
        </p>
        {messages.length > 0 && (
          <button onClick={handleClear} className="mt-2 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 mx-auto">
            <Trash2 className="w-3 h-3" />
            Nueva conversación
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="space-y-8 py-4">
            {/* Welcome */}
            <div className="card p-6 text-center">
              <Sparkles className="w-8 h-8 text-primary-400 mx-auto mb-3" />
              <h2 className="font-semibold text-gray-900 mb-2">¿Qué puedo hacer por ti?</h2>
              <p className="text-sm text-gray-500">
                Puedo buscar proyectos de AI en Numaris, ayudarte a encontrar herramientas similares a lo que quieres construir, y responderte preguntas sobre las iniciativas existentes.
              </p>
            </div>

            {/* Suggested questions */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Preguntas sugeridas:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left p-4 bg-white border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/50 transition-all text-sm text-gray-700 group"
                  >
                    <span className="text-primary-400 group-hover:text-primary-600 transition-colors">→ </span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}

            {mutation.isPending && (
              <div className="flex gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 py-4 border-t border-gray-100 bg-white">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale algo a ARIA sobre los proyectos de Numaris..."
            className="input flex-1"
            disabled={mutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || mutation.isPending}
            className="btn-primary px-4"
          >
            {mutation.isPending ? (
              <span className="spinner w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
