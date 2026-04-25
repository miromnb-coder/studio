
index 81498eef6767305488fcd5013f87189de350fac1..ec685a53136d57e043e44bb776f350361f27d2b5 100644
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -1,47 +1,52 @@
 import type { Metadata } from 'next';
 import './globals.css';
 import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from './config/product';
 import { AuthSync } from '@/components/auth/auth-sync';
 import { GlobalMenuProvider } from './components/global-menu-provider';
 
 export const metadata: Metadata = {
   title: PRODUCT_NAME,
   description: PRODUCT_DESCRIPTION,
   applicationName: PRODUCT_NAME,
   keywords: ['Kivo', 'AI', 'Assistant', 'Productivity', 'Agent'],
   icons: {
     icon: [
       { url: '/favicon.svg', type: 'image/svg+xml' },
       { url: '/icon.svg', type: 'image/svg+xml' },
     ],
     shortcut: ['/favicon.svg'],
     apple: [
       { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
     ],
   },
   themeColor: '#ffffff',
+  appleWebApp: {
+    capable: true,
+    statusBarStyle: 'default',
+    title: 'Kivo',
+  },
   manifest: '/manifest.webmanifest',
   openGraph: {
     title: PRODUCT_NAME,
     description: PRODUCT_DESCRIPTION,
     siteName: PRODUCT_NAME,
     type: 'website',
     images: [
       {
         url: '/icon.svg',
         type: 'image/svg+xml',
       },
     ],
   },
   twitter: {
     card: 'summary',
     title: PRODUCT_NAME,
     description: PRODUCT_DESCRIPTION,
     images: ['/icon.svg'],
   },
 };
 
 export default function RootLayout({
   children,
 }: Readonly<{
   children: React.ReactNode;
