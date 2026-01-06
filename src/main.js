import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeStorage } from './services/localStorage.js'

// Initialize localStorage on app start
initializeStorage();

const app = createApp(App)

app.use(router)

app.mount('#app')

// Register Service Worker for PWA (VitePWA handles this automatically, but keeping for compatibility)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // VitePWA will handle service worker registration automatically
    // This is kept for manual service worker if needed
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  });
}
