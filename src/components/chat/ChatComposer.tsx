"use client";

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ImageIcon, Loader2, Send } from 'lucide-react';

interface ChatComposerProps {
  input: string;
  isProcessing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatComposer({ input, isProcessing, onInputChange, onSubmit }: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="fixed bottom-0 right-0 left-0 lg:left-[var(--sidebar-width)] p-6 md:p-12 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full pointer-events-auto">
        <Card className="glass !p-2.5 flex items-end gap-3 rounded-[36px] border-white/10 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)]">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full hover:bg-white/5 text-muted-foreground"
          >
            <ImageIcon className="w-6 h-6" />
          </Button>
          <input type="file" className="hidden" ref={fileInputRef} accept="image/*" />
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="How can I optimize your finances today?"
            className="flex-1 border-0 focus-visible:ring-0 bg-transparent min-h-[56px] py-4 text-lg font-medium resize-none overflow-hidden text-white placeholder:text-muted-foreground/20"
            rows={1}
          />
          <Button size="icon" disabled={!input.trim() || isProcessing} onClick={onSubmit} className="w-14 h-14 rounded-full shadow-2xl transition-all">
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </Button>
        </Card>
      </div>
    </div>
  );
}
