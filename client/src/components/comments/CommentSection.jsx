import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Reply, Trash2, MoreHorizontal } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/auth';
import { formatRelativeDate, cn } from '../../utils/helpers';
import ReactionBar from '../projects/ReactionBar';

function CommentForm({ projectId, parentId, onSuccess, placeholder = 'Escribe un comentario...' }) {
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post('/comments', { projectId, content, parentId }),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries(['project', projectId]);
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate();
  };

  // Handle @mentions
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        className="input flex-1 resize-none"
      />
      <button
        type="submit"
        disabled={!content.trim() || mutation.isPending}
        className="btn-primary self-end px-3 py-2"
      >
        {mutation.isPending ? (
          <span className="spinner w-4 h-4" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
}

function Comment({ comment, projectId, depth = 0 }) {
  const { user, isAdmin } = useAuthStore();
  const [showReply, setShowReply] = useState(false);
  const queryClient = useQueryClient();

  const canDelete = user?.id === comment.authorId || isAdmin();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/comments/${comment.id}`),
    onSuccess: () => queryClient.invalidateQueries(['project', projectId]),
  });

  // Replace @mentions with bold text
  const formatContent = (text) => {
    return text.replace(/@(\w+)/g, '<strong class="text-primary-600">@$1</strong>');
  };

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-8 mt-3')}>
      {comment.author?.avatarUrl ? (
        <img
          src={comment.author.avatarUrl}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-semibold text-primary-700">
            {comment.author?.name?.charAt(0)?.toUpperCase()}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{comment.author?.name}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">{formatRelativeDate(comment.createdAt)}</span>
              {canDelete && (
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                  title="Eliminar comentario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <p
            className="text-sm text-gray-700 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1.5 px-1">
          <ReactionBar targetType="COMMENT" targetId={comment.id} />
          {depth === 0 && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Responder
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <div className="mt-2 ml-0">
            <CommentForm
              projectId={projectId}
              parentId={comment.id}
              placeholder={`Responder a ${comment.author?.name}...`}
              onSuccess={() => setShowReply(false)}
            />
          </div>
        )}

        {/* Replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map(reply => (
              <Comment
                key={reply.id}
                comment={reply}
                projectId={projectId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ projectId, comments = [] }) {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">
        Comentarios ({comments.length})
      </h3>

      <CommentForm projectId={projectId} />

      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Sé el primero en comentar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <Comment key={comment.id} comment={comment} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}
