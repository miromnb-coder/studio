"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Loader2, Cpu } from 'lucide-react';
import { useFirestore, useUser, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { MessageItem, type ChatMessage } from '@/components/chat/MessageItem';

const formatSafeTime = (timestamp: any) => {
  if (!timestamp) return '...';
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '...';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '...';
  }
};

function ChatContent() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams?.get('c');
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isUserLoading, user, router]);

  const messagesQuery = useMemoFirebase(() => {
    try {
      if (!db || !user || !conversationId) return null;
      return query(collection(db, 'users', user.uid, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
    } catch {
      return null;
    }
  }, [db, user, conversationId]);

  const { data: storedMessages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (!mounted) return;
    if (Array.isArray(storedMessages) && storedMessages.length > 0) {
      setLocalMessages(storedMessages as ChatMessage[]);
    } else if (!isMessagesLoading) {
      setLocalMessages([]);
    }
  }, [storedMessages, conversationId, mounted, isMessagesLoading]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isProcessing]);


  const createNewConversation = async (title = 'New Protocol') => {
    if (!user || !db) return '';
    const newConvRef = doc(collection(db, 'users', user.uid, 'conversations'));
    await setDoc(newConvRef, {
      id: newConvRef.id,
      userId: user.uid,
      title,
      isArchived: false,
      isPinned: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    router.push(`/?c=${newConvRef.id}`);
    return newConvRef.id;
  };

  const sendMessage = async (text?: string, fileData?: string) => {
    const content = text || input;
    if (!content && !fileData) return;
    if (!user || !db) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      activeConvId = await createNewConversation(content.slice(0, 30));
    }

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), {
      ...userMessage,
      timestamp: serverTimestamp(),
    });

    setInput('');
    setIsProcessing(true);

    const assistantMsgId = Math.random().toString(36).substr(2, 9);
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setLocalMessages((prev) => [...prev, assistantMessage]);

    try {
      const history = localMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: content,
          history,
          imageUri: fileData,
          userId: user.uid
        }),
      });

      if (!response.ok) throw new Error('Stream connection failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let metadata: any = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.startsWith('__METADATA__:')) {
          const metaLine = chunk.split('\n')[0];
          metadata = JSON.parse(metaLine.replace('__METADATA__:', ''));
          continue;
        }

        fullContent += chunk;
        setLocalMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: fullContent } : m)));
      }

      const finalAssistantMessage: Omit<ChatMessage, 'id' | 'isStreaming'> = {
        role: 'assistant',
        content: fullContent,
        intent: metadata?.intent || 'general',
        data: metadata || null,
        timestamp: serverTimestamp(),
      };

      setLocalMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, ...finalAssistantMessage, isStreaming: false, timestamp: new Date() } : m))
      );

      addDocumentNonBlocking(collection(db, 'users', user.uid, 'conversations', activeConvId!, 'messages'), finalAssistantMessage);
    } catch (err: any) {
      console.error('Streaming Error:', err);
      toast({ variant: 'destructive', title: 'Neural Link Severed', description: "I've lost the stream. Recalibrating." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      <Navbar />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-24 pb-48 px-6 md:px-24 lg:px-48 space-y-12 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {localMessages.length > 0 ? (
            localMessages.map((msg) => <MessageItem key={msg.id} msg={msg} formatSafeTime={formatSafeTime} />)
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-20 pt-32">
              <Cpu className="w-16 h-16 text-primary" />
              <div className="space-y-2">
                <p className="text-2xl font-bold font-headline tracking-tighter">Operator v4.2</p>
                <p className="text-sm font-medium uppercase tracking-[0.3em]">Multi-Agent Streaming Core Online</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ChatComposer input={input} isProcessing={isProcessing} onInputChange={setInput} onSubmit={() => sendMessage()} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
