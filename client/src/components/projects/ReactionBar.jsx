import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Smile } from 'lucide-react';
import api from '../../utils/api';
import { EMOJIS, cn } from '../../utils/helpers';

export default function ReactionBar({ targetType, targetId }) {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);

  const { data: reactions = [] } = useQuery({
    queryKey: ['reactions', targetType, targetId],
    queryFn: () => api.get(`/reactions/${targetType}/${targetId}`).then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (emoji) => api.post('/reactions/toggle', { targetType, targetId, emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries(['reactions', targetType, targetId]);
      queryClient.invalidateQueries(['project', targetId]);
    },
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {reactions.map(({ emoji, count, userReacted, users }) => (
        <button
          key={emoji}
          onClick={() => toggleMutation.mutate(emoji)}
          title={users?.slice(0, 5).join(', ')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-all',
            userReacted
              ? 'bg-primary-100 text-primary-700 border border-primary-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          )}
        >
          <span>{emoji}</span>
          <span className="text-xs font-medium">{count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm transition-colors"
        >
          <Smile className="w-3.5 h-3.5" />
        </button>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex gap-1 z-20 animate-fade-in">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    toggleMutation.mutate(emoji);
                    setShowPicker(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
