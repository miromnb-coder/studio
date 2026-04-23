'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import KivoSidebar, {
  KivoSidebarPanelContent,
  type KivoSidebarProps,
  type KivoSidebarSection,
} from './KivoSidebar';

const RAIL_WIDTH = 84;
const PANEL_WIDTH = 332;
const TOP_OFFSET = 88;
const BOTTOM_OFFSET = 20;

type KivoChatSidebarAreaProps = Omit<KivoSidebarProps, 'panelOpen' | 'activeSection' | 'onSectionChange' | 'onClosePanel'> & {
  initialSection?: KivoSidebarSection | null;
};

export function KivoChatSidebarArea({ initialSection = 'chats', ...sidebarProps }: KivoChatSidebarAreaProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<KivoSidebarSection | null>(initialSection);

  const handleCloseSidebarPanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const handleSidebarSectionChange = useCallback(
    (section: KivoSidebarSection) => {
      if (activeSection === section && panelOpen) {
        setPanelOpen(false);
        return;
      }

      setActiveSection(section);
      setPanelOpen(true);

      switch (section) {
        case 'new':
          sidebarProps.onNewChat?.();
          break;
        case 'search':
          sidebarProps.onSearch?.();
          break;
        case 'agents':
          sidebarProps.onOpenAgents?.();
          break;
        case 'tools':
          sidebarProps.onOpenTools?.();
          break;
        case 'alerts':
          sidebarProps.onOpenAlerts?.();
          break;
        case 'settings':
          sidebarProps.onOpenSettings?.();
          break;
        default:
          break;
      }
    },
    [activeSection, panelOpen, sidebarProps],
  );

  const sharedSidebarProps: KivoSidebarProps = {
    ...sidebarProps,
    panelOpen,
    activeSection,
    onClosePanel: handleCloseSidebarPanel,
    onSectionChange: handleSidebarSectionChange,
  };

  return (
    <>
      <div
        className="fixed left-0 z-[70]"
        style={{
          top: TOP_OFFSET,
          bottom: BOTTOM_OFFSET,
          width: RAIL_WIDTH,
        }}
      >
        <KivoSidebar {...sharedSidebarProps} />
      </div>

      <AnimatePresence initial={false}>
        {panelOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar panel"
              onClick={handleCloseSidebarPanel}
              className="fixed inset-0 z-[65] bg-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed z-[80] overflow-hidden border-r border-black/[0.04] bg-[#F7F8FA]/97 backdrop-blur-xl"
              style={{
                top: TOP_OFFSET,
                bottom: BOTTOM_OFFSET,
                left: RAIL_WIDTH,
                width: PANEL_WIDTH,
                borderTopRightRadius: 28,
                borderBottomRightRadius: 28,
                boxShadow: '18px 0 54px rgba(15,23,42,0.08)',
              }}
              initial={{ width: 0, opacity: 1 }}
              animate={{ width: PANEL_WIDTH, opacity: 1 }}
              exit={{ width: 0, opacity: 1 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <motion.div
                className="h-full"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -10, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <KivoSidebarPanelContent {...sharedSidebarProps} />
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export { RAIL_WIDTH as KIVO_CHAT_SIDEBAR_RAIL_WIDTH };
