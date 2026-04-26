import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';
import { AuthSync } from '@/components/auth/auth-sync';
import { GlobalMenuProvider } from './components/global-menu-provider';
export const metadata: Metadata = { title: PRODUCT_NAME, description: PRODUCT_DESCRIPTION, applicationName: PRODUCT_NAME, appleWebApp: { capable: true, title: PRODUCT_NAME, statusBarStyle: 'default' }, formatDetection:{telephone:false}, keywords:['Kivo','AI','Assistant','Productivity','Agent'], icons:{icon:[{url:'/icon-192.png',sizes:'192x192',type:'image/png'},{url:'/icon-512.png',sizes:'512x512',type:'image/png'}],shortcut:['/icon-192.png'],apple:[{url:'/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]}, manifest:'/manifest.webmanifest'};
export const viewport: Viewport = { themeColor:'#f7f7f5', width:'device-width', initialScale:1, viewportFit:'cover' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode;}>) {return (<html lang='en' className='app-bg'><body className='mobile-app app-bg min-h-screen text-primary antialiased'><AuthSync /><GlobalMenuProvider><div className='min-h-screen kivo-page-reveal'>{children}</div></GlobalMenuProvider></body></html>);} 