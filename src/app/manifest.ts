
index 4d5df5655ca7e17d837fa382230f8069707c2758..af1ec907a74173ce57e96b7b067d87c2d4b6b97d 100644
--- a/src/app/manifest.ts
+++ b/src/app/manifest.ts
@@ -1,30 +1,30 @@
 import type { MetadataRoute } from 'next';
 
 export default function manifest(): MetadataRoute.Manifest {
   return {
     name: 'Kivo',
     short_name: 'Kivo',
     description: 'Premium mobile AI command center for analysis, automation, and proactive decision support.',
     start_url: '/',
     display: 'standalone',
-    background_color: '#ffffff',
-    theme_color: '#ffffff',
+    background_color: '#f7f7f5',
+    theme_color: '#f7f7f5',
     icons: [
       {
         src: '/icon.svg',
         sizes: 'any',
         type: 'image/svg+xml',
       },
       {
         src: '/favicon.svg',
         sizes: 'any',
         type: 'image/svg+xml',
       },
       {
-        src: '/apple-icon',
+        src: '/apple-touch-icon.png',
         sizes: '180x180',
         type: 'image/png',
       },
     ],
   };
 }
