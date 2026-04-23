'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import KivoSidebar, {
  KivoSidebarPanelContent,
  type KivoSidebarProps,
  type KivoSidebarSection,
} from './KivoSidebar';

const CLOSED_WIDTH = 84;
const OPEN_WIDTH = 332;
const TOP_OFFSET = 88;
const BOTTOM_OFFSET = 0;

type KivoChatSidebarAreaProps = Omit<
  KivoSidebarProps,
  'panelOpen' | 'activeSection' | 'onSectionChange' | 'onClosePanel'
> & {
  initialSection?: KivoSidebarSection | null;
};

export function KivoChatSidebarArea({
  initialSection = null,
  ...sidebarProps
}: KivoChatSidebarAreaProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<KivoSidebarSection | null>(initialSection);

  const handleCloseSidebarPanel = useCallback(() => {
    setPanelOpen(false);
  }, []);

  const fireSectionAction = useCallback(
    (section: KivoSidebarSection) => {
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
    [
      sidebarProps.onNewChat,
      sidebarProps.onSearch,
      sidebarProps.onOpenAgents,
      sidebarProps.onOpenTools,
      sidebarProps.onOpenAlerts,
      sidebarProps.onOpenSettings,
    ],
  );

  const handleSidebarSectionChange = useCallback(
    (section: KivoSidebarSection) => {
      if (panelOpen && activeSection === section) {
        setPanelOpen(false);
        return;
      }

      setActiveSection(section);
      setPanelOpen(true);
      fireSectionAction(section);
    },
    [activeSection, fireSectionAction, panelOpen],
  );

  const sharedSidebarProps: KivoSidebarProps = useMemo(
    () => ({
      ...sidebarProps,
      panelOpen,
      activeSection,
      onClosePanel: handleCloseSidebarPanel,
      onSectionChange: handleSidebarSectionChange,
    }),
    [
      sidebarProps,
      panelOpen,
      activeSection,
      handleCloseSidebarPanel,
      handleSidebarSectionChange,
    ],
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {panelOpen ? (
          <motion.button
            key="kivo-sidebar-overlay"
            type="button"
            aria-label="Close sidebar"
            onClick={handleCloseSidebarPanel}
            className="fixed inset-0 z-[65] bg-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        aria-label="Kivo sidebar"
        className="fixed left-0 z-[80] overflow-hidden border-r border-black/[0.04] bg-[#F7F8FA]/96 backdrop-blur-xl"
        style={{
          top: TOP_OFFSET,
          bottom: BOTTOM_OFFSET,
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          boxShadow: '18px 0 54px rgba(15,23,42,0.08)',
        }}
        initial={false}
        animate={{ width: panelOpen ? OPEN_WIDTH : CLOSED_WIDTH }}
        transition={{
          duration: panelOpen ? 0.24 : 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="flex h-full min-w-0">
          <div
            className="relative z-[2] h-full shrink-0"
            style={{ width: CLOSED_WIDTH }}
          >
            <KivoSidebar {...sharedSidebarProps} />
          </div>

          <AnimatePresence initial={false} mode="wait">
            {panelOpen && activeSection ? (
              <motion.div
                key={activeSection}
                className="relative h-full min-w-0 flex-1 border-l border-black/[0.035]"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="h-full overflow-hidden bg-transparent">
                  <KivoSidebarPanelContent {...sharedSidebarProps} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}

export {
  CLOSED_WIDTH as KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
  OPEN_WIDTH as KIVO_CHAT_SIDEBAR_OPEN_WIDTH,
};
