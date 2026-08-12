import Aura from '@primevue/themes/aura'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  modules: ['@nuxtjs/tailwindcss', '@primevue/nuxt-module'],
  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],
  primevue: {
    autoImport: true,
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark'
        }
      }
    }
  },
  typescript: {
    strict: true
  },
  nitro: {
    externals: {
      external: ['@neondatabase/serverless']
    }
  }
})
