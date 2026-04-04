"use client";

import { ToolMarketplace } from '@/components/tools/ToolMarketplace';
import { motion } from 'framer-motion';

export default function ToolsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ToolMarketplace />
    </motion.div>
  );
}
