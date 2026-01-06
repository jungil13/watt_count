<script setup>
import { RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'

const deferredPrompt = ref(null)
const showInstallButton = ref(false)

onMounted(() => {
  // Listen for the PWA beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // Prevent default prompt
    deferredPrompt.value = e
    showInstallButton.value = true // Show our custom button
  })
})

// Function to trigger install
const installApp = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  if (outcome === 'accepted') {
    console.log('User accepted the install prompt')
  } else {
    console.log('User dismissed the install prompt')
  }
  deferredPrompt.value = null
  showInstallButton.value = false
}
</script>

<template>
  <RouterView />

  <!-- Install / Download button -->
  <button
    v-if="showInstallButton"
    @click="installApp"
    class="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition"
  >
    Install WattCount
  </button>
</template>
