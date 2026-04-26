'use client';
import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import KivoSidebar, { type KivoSidebarProps, type KivoSidebarSection } from './KivoSidebar';
const RAIL_WIDTH = 56;
export function KivoChatSidebarArea({ initialSection = null, onPanelOpenChange, ...sidebarProps }: any) {
 const router = useRouter(); const pathname = usePathname(); const [activeSection, setActiveSection] = useState<KivoSidebarSection | null>(initialSection);
 const navigateTo = useCallback((href:string, action?:()=>void)=>{ if(pathname===href){onPanelOpenChange?.(false);return;} if(action){action();return;} router.push(href);},[onPanelOpenChange,pathname,router]);
 const fireSectionAction = useCallback((section:KivoSidebarSection)=>{ const map:any={new:['/chat',sidebarProps.onNewChat],search:['/search',sidebarProps.onSearch],chats:['/history'],agents:['/agents',sidebarProps.onOpenAgents],tools:['/tools',sidebarProps.onOpenTools],alerts:['/alerts',sidebarProps.onOpenAlerts],settings:['/settings',sidebarProps.onOpenSettings]}; const [href,fn]=map[section]||[]; if(href) navigateTo(href,fn);},[navigateTo,sidebarProps]);
 const handleSidebarSectionChange = useCallback((section:KivoSidebarSection)=>{ setActiveSection(section); fireSectionAction(section); onPanelOpenChange?.(false);},[fireSectionAction,onPanelOpenChange]);
 const sharedSidebarProps: KivoSidebarProps = useMemo(()=>({...sidebarProps,panelOpen:false,activeSection,onClosePanel:()=>onPanelOpenChange?.(false),onSectionChange:handleSidebarSectionChange}),[sidebarProps,activeSection,handleSidebarSectionChange,onPanelOpenChange]);
 return <motion.aside aria-label="Kivo navigation" className="fixed inset-y-0 left-0 z-[80] overflow-hidden border-r border-black/[0.035] bg-[#F7F8FA]/96 backdrop-blur-xl [contain:layout_paint]" style={{width:RAIL_WIDTH,borderTopRightRadius:18,borderBottomRightRadius:18,boxShadow:'6px 0 18px rgba(15,23,42,0.035)'}} initial={{x:-RAIL_WIDTH,opacity:0.96}} animate={{x:0,opacity:1}} exit={{x:-RAIL_WIDTH,opacity:0.96}} transition={{duration:0.22,ease:[0.22,1,0.36,1]}}><KivoSidebar {...sharedSidebarProps} /></motion.aside>;
}
export { RAIL_WIDTH as KIVO_CHAT_SIDEBAR_RAIL_WIDTH, RAIL_WIDTH as KIVO_CHAT_SIDEBAR_OPEN_WIDTH }; 