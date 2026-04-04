"use client";

import { motion } from 'framer-motion';
import { GlassButton } from '@/components/ui/GlassButton';
import { ArrowRight, Star } from 'lucide-react';
import { useState } from 'react';
import { UpgradePanel } from './UpgradePanel';

export function UpgradeButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group shrink-0"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 to-accent/40 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        <GlassButton 
          size="sm" 
          className="relative !h-8 md:!h-9 !px-3 md:!px-4 !rounded-full !text-[9px] md:!text-[10px] bg-primary border-0 text-white shadow-lg shadow-primary/20 overflow-hidden"
          onClick={() => setIsOpen(true)}
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 bottom-0 w-8 bg-white/20 skew-x-[-20deg]"
          />
          <Star className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 fill-white" />
          <span className="hidden xs:inline">Upgrade</span>
          <ArrowRight className="w-2.5 h-2.5 md:w-3 md:h-3 ml-1 md:ml-1.5 group-hover:translate-x-0.5 transition-transform" />
        </GlassButton>
      </motion.div>

      <UpgradePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
