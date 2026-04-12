'use client';

import { ChevronRight, Plus, Settings2, X } from 'lucide-react';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useEffect } from 'react';
import { ConnectorItem, ConnectorRow } from './ConnectorRow';

type ConnectorsSheetProps = {
  open: boolean;
  connectors: ConnectorItem[];
  onClose: () => void;
  onOpenAddConnector: () => void;
  onOpenManageConnector: () => void;
  onToggleConnected: (id: string, enabled: boolean) => void;
  onConnect: (id: string) => void;
  onRetry: (id: string) => void;
};

const sheetTransition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.72 };

export function ConnectorsSheet({
  open,
  connectors,
  onClose,
  onOpenAddConnector,
  onOpenManageConnector,
  onToggleConnected,
  onConnect,
  onRetry,
}: ConnectorsSheetProps) {
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 550) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close connectors"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="Connectors"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={sheetTransition}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.24 }}
            onDragEnd={onDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[30px] border border-[#dde1e8] bg-[#f6f7f9] px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_64px_rgba(0,0,0,0.64)]"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#c8ced8]" />

            <header className="mb-4 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dce1e8] bg-white text-[#333943] transition hover:bg-[#f3f5f8]"
                aria-label="Close connectors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-[23px] font-semibold tracking-[-0.022em] text-[#22262c]">Connectors</h2>
              <span className="h-10 w-10" aria-hidden />
            </header>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-[#dce1e8] bg-white p-2 shadow-sm">
                <button
                  type="button"
                  onClick={onOpenAddConnector}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[#22262c] transition hover:bg-[#f3f5f8] active:scale-[0.99]"
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span className="text-[16px] font-medium">Add connectors</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#8a93a1]" />
                </button>

                <div className="mx-3 h-px bg-[#e9edf2]" />

                <button
                  type="button"
                  onClick={onOpenManageConnector}
                  className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[#22262c] transition hover:bg-[#f3f5f8] active:scale-[0.99]"
                >
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Settings2 className="h-4 w-4" />
                    </span>
                    <span className="text-[16px] font-medium">Manage connectors</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#8a93a1]" />
                </button>
              </div>

              <div className="rounded-[24px] border border-[#dce1e8] bg-white px-3 py-1 shadow-sm">
                <ul className="max-h-[48vh] divide-y divide-[#edf1f6] overflow-y-auto pr-1">
                  {connectors.map((connector, index) => (
                    <ConnectorRow
                      key={connector.id}
                      connector={connector}
                      index={index}
                      onToggleConnected={onToggleConnected}
                      onConnect={onConnect}
                      onRetry={onRetry}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
