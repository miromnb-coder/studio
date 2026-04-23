import { motion } from 'framer-motion';

export function KivoChatScreenBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f8f9_0%,#f4f5f7_36%,#eef2f6_100%)]" />

      <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.42)_46%,rgba(255,255,255,0)_82%)]" />

      <motion.div
        className="absolute left-1/2 top-[43%] h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(248,250,253,0.46)_36%,rgba(241,244,249,0.12)_68%,rgba(241,244,249,0)_100%)] blur-[26px]"
        animate={{ opacity: [0.86, 1, 0.86] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1/2 bottom-[110px] h-[210px] w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.82)_0%,rgba(246,248,252,0.42)_52%,rgba(246,248,252,0)_100%)] blur-[26px]"
        animate={{ opacity: [0.74, 0.94, 0.74] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-x-0 bottom-0 h-[280px] bg-[linear-gradient(180deg,rgba(244,246,249,0)_0%,rgba(241,244,248,0.34)_36%,rgba(236,240,246,0.88)_76%,rgba(234,239,246,1)_100%)]" />
    </div>
  );
}
