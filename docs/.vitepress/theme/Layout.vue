<script setup lang="ts">
import DefaultTheme from "vitepress/theme-without-fonts"
import { onMounted, ref } from "vue"
import HomeInstall from "./HomeInstall.md"

const autoplay = ref(false)
onMounted(() => {
  autoplay.value = !globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-actions-after>
      <div class="home-install vp-doc"><HomeInstall /></div>
    </template>
    <template #home-hero-image>
      <figure class="home-demo">
        <video
          :autoplay="autoplay"
          muted
          playsinline
          preload="none"
          poster="/demos/quickstart.png"
          width="1800"
          height="1200"
          aria-label="Zaly quickstart: fix a calculation bug and run its tests"
        >
          <source src="/demos/quickstart.webm" type="video/webm" />
          <a href="/demos/quickstart.webm">Watch the quickstart recording.</a>
        </video>
      </figure>
    </template>
  </DefaultTheme.Layout>
</template>
