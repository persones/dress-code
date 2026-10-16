<script setup>
defineProps({
  office: { type: Object, required: true },
  units: { type: String, required: true },
  dayLabel: { type: String, required: true },
});
</script>

<template>
  <section class="card">
    <h2>{{ office.label }}</h2>
    <span class="day">{{ dayLabel }}</span>
    <div class="stat">
      <span class="label">High</span>
      <span class="value">{{ office.maxTemp ?? '–' }}°{{ units }}</span>
    </div>
    <div class="stat">
      <span class="label">Rain</span>
      <span class="value rain">{{ office.rainChance ?? '–' }}%</span>
    </div>
  </section>
</template>

<style scoped>
.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3vh;
  padding: 2.5vh 3vh;
  background: var(--card);
  border-radius: var(--radius);
}
h2 {
  margin: 0;
  font-size: 4vh;
}
.day {
  margin-top: -2.5vh;
  font-size: 2.6vh;
  color: var(--muted);
}
.stat {
  display: flex;
  flex-direction: column;
}
.label {
  font-size: 2.5vh;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.value {
  font-size: 8vh;
  font-weight: 700;
  line-height: 1.1;
}
.rain {
  color: var(--rain);
}
</style>
