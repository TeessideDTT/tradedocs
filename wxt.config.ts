import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    version: '0.1.0',
    permissions: ['sidePanel', 'storage'],
    name: 'TDO Builder',
    description: 'Create UN/CEFACT compliant trade docs directly in your browser.',
    action: {
      default_title: 'Open Sidepanel',
    },
  },
});
