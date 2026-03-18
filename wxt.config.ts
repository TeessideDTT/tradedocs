import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['sidePanel', 'storage'],
    name: 'TradeDocs - UN/CEFACT Invoice Creator',
    description: 'Create UN/CEFACT compliant invoices directly in your browser sidepanel.',
    action: {
      default_title: 'Open Sidepanel',
    },
  },
});
