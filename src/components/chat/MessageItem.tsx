"use client";

import { motion } from 'framer-motion';
import { Coins, Clock, Zap, Cpu, BrainCircuit } from 'lucide-react';
import { RichAnalysisCard } from '@/components/chat/RichAnalysisCard';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'analysis_result' | 'daily_digest' | 'error' | 'system';
  intent?: string;
  mode?: string;
  data?: any;
  timestamp: any;
  isStreaming?: boolean;
}

interface MessageItemProps {
  msg: ChatMessage;
  formatSafeTime: (timestamp: any) => string;
}

const getModeIcon = (mode?: string) => {
  switch (mode) {
    case 'finance':
      return <Coins className="w-3.5 h-3.5 text-primary" />;
    case 'time_optimizer':
      return <Clock className="w-3.5 h-3.5 text-accent" />;
    case 'monetization':
      return <Zap className="w-3.5 h-3.5 text-warning" />;
    case 'technical':
      return <Cpu className="w-3.5 h-3.5 text-muted-foreground" />;
    default:
      return <BrainCircuit className="w-3.5 h-3.5 text-primary" />;
  }
};

export function MessageItem({ msg, formatSafeTime }: MessageItemProps) {
  return (
    <motion.div
      key={msg.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex w-full group', msg.role === 'user' ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[95%] md:max-w-[85%] space-y-4', msg.role === 'user' ? 'items-end text-right' : 'items-start text-left')}>
        {msg.role === 'assistant' && (
          <div className="flex items-center gap-3 mb-2 ml-1">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">{getModeIcon(msg.intent)}</div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
              {msg.intent?.replace('_', ' ') || 'Operator'} • Neural Stream Active
            </span>
          </div>
        )}

        <div className="flex items-center gap-5">
          <div
            className={cn(
              'p-6 rounded-[28px] text-sm md:text-lg leading-relaxed font-medium shadow-2xl relative',
              msg.role === 'user'
                ? 'bg-primary text-background rounded-tr-none'
                : 'bg-white/[0.03] border border-white/5 text-foreground rounded-tl-none shadow-black/40',
              msg.isStreaming ? 'animate-pulse' : ''
            )}
          >
            {msg.content}
            {!msg.isStreaming && (
              <span className="absolute -bottom-6 right-1 text-[8px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">
                {formatSafeTime(msg.timestamp)}
              </span>
            )}
          </div>
        </div>

        {msg.data?.toolResults && msg.data.toolResults.length > 0 && !msg.isStreaming && (
          <RichAnalysisCard data={{ ...msg.data, summary: msg.content }} />
        )}
      </div>
    </motion.div>
  );
}
