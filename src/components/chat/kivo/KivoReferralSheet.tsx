'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Copy,
  Mail,
  Send,
  Share2,
  Users,
  X,
} from 'lucide-react';

type KivoReferralSheetProps = {
  open: boolean;
  onClose: () => void;
  inviteLink?: string;
  rewardLabel?: string;
  creditsEarned?: number;
  successfulReferrals?: number;
  pendingInvites?: number;
  onSendEmailInvite?: (email: string) => Promise<void> | void;
};

export function KivoReferralSheet({
  open,
  onClose,
  inviteLink = 'https://kivo.app/invite/miro123',
  rewardLabel = 'Earn rewards for every successful referral',
  creditsEarned = 500,
  successfulReferrals = 1,
  pendingInvites = 2,
  onSendEmailInvite,
}: KivoReferralSheetProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setCopied(false);
      setSending(false);
      setSent(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const canSendEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join Kivo',
          text: 'Try Kivo with my invite link.',
          url: inviteLink,
        });
        return;
      }

      await handleCopy();
    } catch {
      // ignore cancel
    }
  };

  const handleSendEmail = async () => {
    if (!canSendEmail || sending) return;

    setSending(true);
    try {
      await onSendEmailInvite?.(email.trim());
      setSent(true);
      setEmail('');
      window.setTimeout(() => setSent(false), 1800);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close referral sheet"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/[0.16] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[560px] rounded-t-[34px] border border-black/[0.05] bg-[rgba(245,245,247,0.96)] px-4 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4 shadow-[0_-20px_50px_rgba(15,23,42,0.12)] backdrop-blur-2xl"
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="mx-auto mb-4 h-[5px] w-14 rounded-full bg-black/[0.10]" />

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[22px] font-medium tracking-[-0.04em] text-[#2f3640]">
                Invite friends
              </h2>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.05] bg-white/70 text-[#6f7785]"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <section className="rounded-[26px] border border-black/[0.05] bg-white/82 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f4f6fa] text-[#4b5563]">
                <Users className="h-7 w-7" strokeWidth={1.9} />
              </div>

              <h3 className="mt-4 text-[26px] font-semibold tracking-[-0.05em] text-[#2f3640]">
                Share Kivo, earn rewards
              </h3>

              <p className="mt-2 text-[14px] leading-6 text-[#7a8190]">
                Invite friends with your personal link. Rewards are added after a successful signup.
              </p>

              <div className="mt-4 rounded-[20px] border border-black/[0.05] bg-[#f8f9fb] px-4 py-3">
                <p className="text-[13px] font-medium text-[#8a919e]">Your reward</p>
                <p className="mt-1 text-[16px] font-medium tracking-[-0.02em] text-[#2f3640]">
                  {rewardLabel}
                </p>
              </div>
            </section>

            <section className="mt-4 rounded-[26px] border border-black/[0.05] bg-white/82 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-[13px] font-medium text-[#8a919e]">Invite link</p>

              <div className="mt-2 rounded-[18px] border border-black/[0.05] bg-[#f8f9fb] px-4 py-3 text-[14px] text-[#4b5563]">
                <span className="block truncate">{inviteLink}</span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#111111] text-sm font-medium text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-black/[0.06] bg-white text-sm font-medium text-[#374151]"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </section>

            <section className="mt-4 rounded-[26px] border border-black/[0.05] bg-white/82 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
                Send invite by email
              </p>

              <div className="mt-3 flex gap-2">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a0ad]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter email address"
                    className="h-12 w-full rounded-full border border-black/[0.05] bg-[#f8f9fb] pl-11 pr-4 text-[15px] text-[#38404a] outline-none placeholder:text-[#98a0ad]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!canSendEmail || sending}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium ${
                    canSendEmail && !sending
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#d7dbe2] text-white'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending' : sent ? 'Sent' : 'Send'}
                </button>
              </div>
            </section>

            <section className="mt-4 rounded-[26px] border border-black/[0.05] bg-white/82 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
                  Referral stats
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <StatCard label="Credits earned" value={String(creditsEarned)} />
                <StatCard label="Successful" value={String(successfulReferrals)} />
                <StatCard label="Pending" value={String(pendingInvites)} />
              </div>
            </section>

            <section className="mt-4 rounded-[26px] border border-black/[0.05] bg-white/82 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <h3 className="text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
                How it works
              </h3>

              <div className="mt-3 space-y-2 text-[14px] leading-6 text-[#7a8190]">
                <p>1. Share your invite link.</p>
                <p>2. Your friend signs up with your link.</p>
                <p>3. Rewards are added after a successful signup.</p>
              </div>
            </section>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.05] bg-[#f8f9fb] px-3 py-4">
      <p className="text-[22px] font-semibold tracking-[-0.04em] text-[#2f3640]">
        {value}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-[#8a919e]">{label}</p>
    </div>
  );
}
