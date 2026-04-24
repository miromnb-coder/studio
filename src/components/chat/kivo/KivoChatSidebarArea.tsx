'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import KivoSidebar, {
  KivoSidebarPanelContent,
  type KivoSidebarProps,
  type KivoSidebarSection,
} from './KivoSidebar';

const CLOSED_WIDTH = 72;
const OPEN_WIDTH = 288;

type KivoChatSidebarAreaProps = Omit<
  KivoSidebarProps,
  'panelOpen' | 'activeSection' | 'onSectionChange' | 'onClosePanel'
> & {
  initialSection?: KivoSidebarSection | null;
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
};

export function KivoChatSidebarArea({
  initialSection = 'chats',
  panelOpen: controlledPanelOpen,
  onPanelOpenChange,
  ...sidebarProps
}: KivoChatSidebarAreaProps) {
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<KivoSidebarSection | null>(
    initialSection,
  );

  const panelOpen =
    typeof controlledPanelOpen === 'boolean' ? controlledPanelOpen : internalPanelOpen;

  const setPanelOpenState = useCallback(
    (next: boolean) => {
      if (typeof controlledPanelOpen !== 'boolean') {
        setInternalPanelOpen(next);
      }

      onPanelOpenChange?.(next);
    },
    [controlledPanelOpen, onPanelOpenChange],
  );

  const handleCloseSidebarPanel = useCallback(() => {
    setPanelOpenState(false);
  }, [setPanelOpenState]);

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
        setPanelOpenState(false);
        return;
      }

      setActiveSection(section);
      setPanelOpenState(true);
      fireSectionAction(section);
    },
    [activeSection, fireSectionAction, panelOpen, setPanelOpenState],
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
        className="fixed inset-y-0 left-0 z-[80] overflow-hidden border-r border-black/[0.035] bg-[#F7F8FA]/96 backdrop-blur-xl"
        style={{
          borderTopRightRadius: 22,
          borderBottomRightRadius: 22,
          boxShadow: panelOpen
            ? '14px 0 42px rgba(15,23,42,0.08)'
            : '6px 0 18px rgba(15,23,42,0.035)',
        }}
        initial={false}
        animate={{ width: panelOpen ? OPEN_WIDTH : CLOSED_WIDTH }}
        transition={{
          duration: panelOpen ? 0.24 : 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="flex h-full min-w-0">
          <div className="relative z-[2] h-full shrink-0" style={{ width: CLOSED_WIDTH }}>
            <KivoSidebar {...sharedSidebarProps} />
          </div>

          <AnimatePresence initial={false} mode="wait">
            {panelOpen ? (
              <motion.div
                key={activeSection ?? 'chats'}
                className="relative h-full min-w-0 flex-1 border-l border-black/[0.03]"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
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
