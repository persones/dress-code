<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import KidsPanel from './components/KidsPanel.vue';
import OfficePanel from './components/OfficePanel.vue';

const RETRY_MS = 30_000;

const data = ref(null);
const error = ref(null);
const offline = ref(false);
let timer;

async function load() {
  try {
    const res = await fetch('/api/dashboard');
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.statusText);
    data.value = body;
    offline.value = false;
    error.value = null;
  } catch (err) {
    offline.value = true;
    if (!data.value) error.value = err.message;
  } finally {
    const delay = data.value ? data.value.clientRefreshMinutes * 60_000 : RETRY_MS;
    timer = setTimeout(load, delay);
  }
}

onMounted(load);
onUnmounted(() => clearTimeout(timer));

const dayLabel = computed(() => (data.value?.isTomorrow ? 'Tomorrow' : 'Today'));
const dateLabel = computed(() =>
  new Date(`${data.value.targetDate}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }),
);
const updatedLabel = computed(() =>
  data.value?.fetchedAt
    ? new Date(data.value.fetchedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : '—',
);
</script>

<template>
  <div v-if="data" class="page">
    <KidsPanel class="kids" :data="data" :day-label="dayLabel" :date-label="dateLabel" />
    <aside class="side">
      <OfficePanel :office="data.office" :units="data.units" :day-label="dayLabel" />
      <footer class="status">
        <span v-if="data.stale" class="stale">Forecast may be out of date</span>
        <span>Updated {{ updatedLabel }}</span>
        <span class="dot" :class="{ offline }" :title="offline ? 'Offline' : 'Online'"></span>
      </footer>
    </aside>
  </div>
  <div v-else class="loading">{{ error ? `Waiting for forecast… (${error})` : 'Loading…' }}</div>
</template>

<style>
:root {
  --bg: #f4f7fb;
  --card: #ffffff;
  --text: #1d2733;
  --muted: #6b7a8c;
  --accent: #f28c28;
  --rain: #4a90e2;
  --radius: 2vh;
}
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
.page {
  display: grid;
  grid-template-columns: 65fr 35fr;
  gap: 2vh;
  height: 100vh;
  padding: 2vh;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 2vh;
  min-height: 0;
}
.status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.5vh;
  color: var(--muted);
  font-size: 2.2vh;
}
.stale {
  color: var(--accent);
}
.dot {
  width: 1.6vh;
  height: 1.6vh;
  border-radius: 50%;
  background: #3cb371;
}
.dot.offline {
  background: #d9534f;
}
.loading {
  display: grid;
  place-items: center;
  height: 100vh;
  font-size: 4vh;
  color: var(--muted);
}
</style>
