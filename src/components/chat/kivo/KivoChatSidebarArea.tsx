'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import KivoSidebar, {
  type KivoSidebarProps,
  type KivoSidebarSection,
} from './KivoSidebar';

const RAIL_WIDTH = 56;

type KivoChatSidebarAreaProps = Omit<
  KivoSidebarProps,
  'panelOpen' | 'activeSection' | 'onSectionChange' | 'onClosePanel'
> & {
  initialSection?: KivoSidebarSection | null;
  panelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
};

export function KivoChatSidebarArea({
  initialSection = null,
  onPanelOpenChange,
  ...sidebarProps
}: KivoChatSidebarAreaProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<KivoSidebarSection | null>(
    initialSection,
  );

  const navigateTo = useCallback(
    (href: string, action?: () => void) => {
      if (pathname === href) {
        onPanelOpenChange?.(false);
        return;
      }

      if (action) {
        action();
        return;
      }

      router.push(href);
    },
    [onPanelOpenChange, pathname, router],
  );

  const fireSectionAction = useCallback(
    (section: KivoSidebarSection) => {
      switch (section) {
        case 'new':
          navigateTo('/chat', sidebarProps.onNewChat);
          break;
        case 'search':
          navigateTo('/search', sidebarProps.onSearch);
          break;
        case 'chats':
          navigateTo('/history');
          break;
        case 'agents':
          navigateTo('/agents', sidebarProps.onOpenAgents);
          break;
        case 'tools':
          navigateTo('/tools', sidebarProps.onOpenTools);
          break;
        case 'alerts':
          navigateTo('/alerts', sidebarProps.onOpenAlerts);
          break;
        case 'settings':
          navigateTo('/settings', sidebarProps.onOpenSettings);
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
      navigateTo,
    ],
  );

  const handleSidebarSectionChange = useCallback(
    (section: KivoSidebarSection) => {
      setActiveSection(section);
      fireSectionAction(section);

      // This sidebar no longer expands into a panel.
      // Keep the rail visible, but make sure the old panel state is closed.
      onPanelOpenChange?.(false);
    },
    [fireSectionAction, onPanelOpenChange],
  );

  const sharedSidebarProps: KivoSidebarProps = useMemo(
    () => ({
      ...sidebarProps,
      panelOpen: false,
      activeSection,
      onClosePanel: () => onPanelOpenChange?.(false),
      onSectionChange: handleSidebarSectionChange,
    }),
    [sidebarProps, activeSection, handleSidebarSectionChange, onPanelOpenChange],
  );

  return (
    <motion.aside
      aria-label="Kivo navigation"
      className="fixed inset-y-0 left-0 z-[80] overflow-hidden border-r border-black/[0.035] bg-[#F7F8FA]/96 backdrop-blur-xl"
      style={{
        width: RAIL_WIDTH,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        boxShadow: '6px 0 18px rgba(15,23,42,0.035)',
      }}
      initial={{ x: -RAIL_WIDTH, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -RAIL_WIDTH, opacity: 0 }}
      transition={{
        duration: 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <KivoSidebar {...sharedSidebarProps} />
    </motion.aside>
  );
}

export {
  RAIL_WIDTH as KIVO_CHAT_SIDEBAR_RAIL_WIDTH,
  RAIL_WIDTH as KIVO_CHAT_SIDEBAR_OPEN_WIDTH,
};
