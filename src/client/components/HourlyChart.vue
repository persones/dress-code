<script setup>
import { computed } from 'vue';

const props = defineProps({
  hours: { type: Array, required: true },
});

// Drawing area in viewBox units; the SVG scales to its container.
const W = 1000;
const H = 400;
const PAD = { left: 20, right: 70, top: 90, bottom: 45 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;
const bottom = PAD.top + plotH;
const ICON = 56;

const band = computed(() => plotW / Math.max(props.hours.length, 1));

const tempRange = computed(() => {
  const temps = props.hours.map((h) => h.temp);
  const min = Math.min(...temps) - 3;
  const max = Math.max(...temps) + 3;
  return { min, span: Math.max(max - min, 1) };
});

const points = computed(() =>
  props.hours.map((h, i) => {
    const x = PAD.left + band.value * (i + 0.5);
    // Keep the temp line in the upper part so labels don't collide with rain bars.
    const y = PAD.top + 30 + (1 - (h.temp - tempRange.value.min) / tempRange.value.span) * (plotH * 0.55);
    const barH = (h.rainChance / 100) * plotH;
    return { ...h, x, y, barH, label: hourLabel(h.hour) };
  }),
);

const linePath = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' '));

function hourLabel(hour) {
  const h = hour % 12 || 12;
  return `${h}${hour < 12 ? 'am' : 'pm'}`;
}

const rainTicks = [0, 50, 100];
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hourly temperature and rain">
    <!-- rain axis gridlines -->
    <g v-for="t in rainTicks" :key="t">
      <line
        :x1="PAD.left"
        :x2="W - PAD.right"
        :y1="bottom - (t / 100) * plotH"
        :y2="bottom - (t / 100) * plotH"
        class="grid"
      />
      <text :x="W - PAD.right + 10" :y="bottom - (t / 100) * plotH + 7" class="axis">{{ t }}%</text>
    </g>

    <!-- rain bars -->
    <rect
      v-for="p in points"
      :key="`bar-${p.hour}`"
      :x="p.x - band * 0.3"
      :y="bottom - p.barH"
      :width="band * 0.6"
      :height="p.barH"
      class="bar"
      rx="6"
    />

    <!-- condition icons -->
    <image
      v-for="p in points"
      :key="`icon-${p.hour}`"
      :href="`/assets/weather/${p.condition}.svg`"
      :x="p.x - ICON / 2"
      :y="10"
      :width="ICON"
      :height="ICON"
    />

    <!-- temperature line -->
    <path :d="linePath" class="line" />
    <g v-for="p in points" :key="`pt-${p.hour}`">
      <circle :cx="p.x" :cy="p.y" r="7" class="point" />
      <text :x="p.x" :y="p.y - 16" class="temp">{{ p.temp }}°</text>
    </g>

    <!-- hour labels -->
    <text v-for="p in points" :key="`h-${p.hour}`" :x="p.x" :y="H - 12" class="hour">{{ p.label }}</text>
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  height: 100%;
  display: block;
}
.grid {
  stroke: #e3e8ef;
  stroke-width: 2;
}
.axis {
  fill: var(--rain);
  font-size: 20px;
}
.bar {
  fill: var(--rain);
  opacity: 0.3;
}
.line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 5;
  stroke-linejoin: round;
}
.point {
  fill: var(--accent);
}
.temp {
  font-size: 26px;
  font-weight: 700;
  text-anchor: middle;
  fill: var(--text);
}
.hour {
  font-size: 22px;
  text-anchor: middle;
  fill: var(--muted);
}
</style>
