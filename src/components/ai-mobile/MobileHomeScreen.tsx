"use client";

import {
  Bell,
  Bot,
  Brain,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  History,
  Home,
  LineChart,
  MessageSquare,
  Search,
  SendHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFirestore, useMemoFirebase, useCollection, useUser, addDocumentNonBlocking } from "@/firebase";
import { collection, limit, orderBy, query, serverTimestamp } from "firebase/firestore";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

type ActivityItem = {
  id: string;
  title: string;
  time: string;
  statusColor: string;
  icon: React.ReactNode;
  href: string;
};

const starterMessages: ChatMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    content:
      "Good morning — I scanned your latest receipts and found 2 rising subscriptions plus 1 duplicate annual charge.",
  },
  {
    id: "seed-2",
    role: "user",
    content: "What should I fix first to reduce monthly spend?",
  },
  {
    id: "seed-3",
    role: "assistant",
    content:
      "Start with StreamPlus (+$6 this month) and the duplicate CloudVault renewal. I can draft cancellation and refund requests now.",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const activities: ActivityItem[] = [
  {
    id: "1",
    title: "Analyzed market trends",
    time: "2 minutes ago",
    statusColor: "bg-emerald-400",
    icon: <LineChart className="h-5 w-5" />,
    href: "/history",
  },
  {
    id: "2",
    title: "Updated project memory",
    time: "15 minutes ago",
    statusColor: "bg-emerald-400",
    icon: <Database className="h-5 w-5" />,
    href: "/history",
  },
  {
    id: "3",
    title: "Generated weekly report",
    time: "1 hour ago",
    statusColor: "bg-indigo-500",
    icon: <FileText className="h-5 w-5" />,
    href: "/dashboard",
  },
];

function TopBar() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-400 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">Signal Operator</span>
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/history")}
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <button
          onClick={() => router.push("/settings")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-300 text-xs font-semibold text-white"
          aria-label="Profile"
        >
          SO
        </button>
      </div>
    </div>
  );
}

function GreetingSection() {
  return (
    <section className="px-5 pt-6">
      <h1 className="text-[50px] sm:text-[42px] font-semibold leading-tight tracking-[-0.04em] text-slate-900">
        Good morning, Operator 👋
      </h1>
      <p className="mt-2 text-[16px] leading-7 text-slate-500">
        Your financial AI agents are ready to analyze statements, subscriptions, and hidden charges.
      </p>
    </section>
  );
}

function AiOperatorCard() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const endRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "operator_messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );
  }, [db, user]);

  const { data: persistedMessages } = useCollection<{ role: Role; content: string }>(messagesQuery);

  useEffect(() => {
    if (persistedMessages && persistedMessages.length > 0) {
      setMessages(
        persistedMessages
          .filter((item) => item.content)
          .map((item) => ({ id: item.id, role: item.role, content: item.content }))
      );
    }
  }, [persistedMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const quickActions = useMemo(
    () => [
      { label: "Research", icon: <Search className="h-4 w-4" />, prompt: "Research recent subscription price increases in my transactions." },
      { label: "Analyze", icon: <LineChart className="h-4 w-4" />, prompt: "Analyze my latest receipts for duplicate and hidden charges." },
      { label: "Create", icon: <FileText className="h-4 w-4" />, prompt: "Create an action plan to cancel wasteful subscriptions this week." },
      { label: "Automate", icon: <Workflow className="h-4 w-4" />, prompt: "Automate monitoring for trials converting to paid subscriptions." },
    ],
    []
  );

  const sendMessage = async (preset?: string) => {
    const content = (preset ?? input).trim();
    if (!content || isThinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    if (db && user) {
      addDocumentNonBlocking(collection(db, "users", user.uid, "operator_messages"), {
        role: "user",
        content,
        createdAt: serverTimestamp(),
      });
    }

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: content,
          history: history.slice(0, -1),
          userId: user?.uid || "system_anonymous",
        }),
      });

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const sanitized = chunk
          .split("\n")
          .filter((line) => !line.startsWith("__METADATA__:"))
          .join("\n");
        assistantText += sanitized;
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantText.trim() || "I finished the analysis and can continue with deeper actions.",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (db && user) {
        addDocumentNonBlocking(collection(db, "users", user.uid, "operator_messages"), {
          role: "assistant",
          content: assistantMessage.content,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I hit a processing issue. Please retry and I will continue the financial operation flow.",
        },
      ]);
      console.error("[OPERATOR_CHAT_ERROR]", error);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <section className="px-5 pt-5">
      <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="p-5">
          <p className="text-[42px] sm:text-[34px] font-medium tracking-[-0.02em] text-slate-600">
            What would you like to accomplish today?
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[28px] sm:text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <span className="text-slate-500">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[290px] space-y-3 overflow-y-auto border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-6",
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] text-slate-500">
                thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message Signal Operator"
              className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-[14px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-300"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isThinking}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-slate-900 text-white transition-opacity disabled:opacity-40"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => router.push("/history")}
            className="mt-3 text-[13px] text-slate-500 transition-colors hover:text-slate-700"
          >
            <span className="font-semibold text-slate-700">Try:</span> Analyze recurring subscriptions · Detect duplicate charges
          </button>
        </div>
      </div>
    </section>
  );
}

function RecentActivityCard() {
  const router = useRouter();

  return (
    <div className="px-5 pt-5">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.045)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[35px] sm:text-[21px] font-semibold tracking-[-0.02em] text-slate-900">Recent Activity</h2>
          <button
            onClick={() => router.push("/history")}
            className="inline-flex items-center gap-1 text-[30px] sm:text-[16px] text-slate-400 transition-colors hover:text-slate-600"
          >
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {activities.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left transition-colors hover:bg-slate-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">{item.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[30px] sm:text-[16px] font-medium text-slate-800">{item.title}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[24px] sm:text-[14px] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{item.time}</span>
                </div>
              </div>
              <span className={cn("h-2.5 w-2.5 rounded-full", item.statusColor)} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SupportingCards() {
  const router = useRouter();

  return (
    <div className="grid gap-4 px-5 pt-5 pb-28 lg:grid-cols-2">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[34px] sm:text-[20px] font-semibold text-slate-900">Active Agents</h3>
          <button onClick={() => router.push("/dashboard")} className="text-slate-300">•••</button>
        </div>

        <div className="space-y-4">
          {[
            ["Research Agent", "Gathering latest information", <Search className="h-5 w-5" key="s" />, "bg-indigo-100 text-indigo-600"],
            ["Analysis Agent", "Processing your data", <LineChart className="h-5 w-5" key="l" />, "bg-sky-100 text-sky-600"],
            ["Memory Agent", "Updating knowledge base", <Database className="h-5 w-5" key="d" />, "bg-amber-100 text-amber-600"],
          ].map(([name, subtitle, icon, accent]) => (
            <button key={String(name)} onClick={() => router.push("/dashboard")} className="flex w-full items-start gap-3 text-left">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", String(accent))}>{icon}</div>
              <div>
                <p className="text-[28px] sm:text-[16px] font-medium text-slate-800">{name}</p>
                <p className="text-[23px] sm:text-[14px] text-slate-400">{subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-4">
        <button onClick={() => router.push("/history")} className="w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[28px] sm:text-[16px] font-semibold text-slate-900">Memory Usage</p>
              <p className="text-[24px] sm:text-[16px] text-slate-500">2.2 GB / 5 GB</p>
            </div>
          </div>
        </button>

        <button onClick={() => router.push("/money-saver")} className="w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <LineChart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[28px] sm:text-[16px] font-semibold text-slate-900">Monthly Savings</p>
                <p className="text-[24px] sm:text-[16px] text-slate-500">This month</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </div>
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { label: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { label: "Chat", href: "/", icon: <MessageSquare className="h-5 w-5" /> },
    { label: "Agents", href: "/dashboard", icon: <Bot className="h-5 w-5" /> },
    { label: "Alerts", href: "/money-saver", icon: <Bell className="h-5 w-5" /> },
    { label: "History", href: "/history", icon: <History className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex min-w-[56px] flex-1 flex-col items-center gap-1 py-1"
            >
              <span className={active ? "text-indigo-600" : "text-slate-400"}>{item.icon}</span>
              <span className={cn("text-[12px]", active ? "text-indigo-600" : "text-slate-400")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MobileHomeScreen() {
  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <div className="mx-auto w-full max-w-3xl">
        <TopBar />
        <GreetingSection />
        <AiOperatorCard />
        <RecentActivityCard />
        <SupportingCards />
      </div>
      <BottomNav />
    </div>
  );
}
