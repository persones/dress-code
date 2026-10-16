<script setup>
import HourlyChart from './HourlyChart.vue';
import ClothesList from './ClothesList.vue';

defineProps({
  data: { type: Object, required: true },
  dayLabel: { type: String, required: true },
  dateLabel: { type: String, required: true },
});
</script>

<template>
  <section class="card">
    <header class="title">
      <h1>{{ dayLabel }}</h1>
      <span class="date">{{ dateLabel }}</span>
    </header>

    <div class="headline">
      <img
        v-if="data.home.condition"
        class="icon"
        :src="`/assets/weather/${data.home.condition}.svg`"
        :alt="data.home.description"
      />
      <div class="stat now">
        <span class="label">Now</span>
        <span class="value">{{ data.home.current.temp }}°</span>
      </div>
      <div class="stat">
        <span class="label">High</span>
        <span class="value">{{ data.home.maxTemp ?? '–' }}°</span>
      </div>
      <div class="stat">
        <span class="label">Rain</span>
        <span class="value rain">{{ data.home.rainChance ?? '–' }}%</span>
      </div>
    </div>
    <p class="description">{{ data.home.description }}</p>

    <HourlyChart class="chart" :hours="data.home.hourly" />
    <ClothesList :clothes="data.clothes" />
  </section>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 2.5vh 3vh;
  background: var(--card);
  border-radius: var(--radius);
}
.title {
  display: flex;
  align-items: baseline;
  gap: 2vh;
}
h1 {
  margin: 0;
  font-size: 4.5vh;
}
.date {
  font-size: 3vh;
  color: var(--muted);
}
.headline {
  display: flex;
  align-items: center;
  gap: 4vh;
  margin-top: 1vh;
}
.icon {
  width: 13vh;
  height: 13vh;
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
  font-size: 7vh;
  font-weight: 700;
  line-height: 1;
}
.now .value {
  font-size: 10vh;
}
.rain {
  color: var(--rain);
}
.description {
  margin: 0.5vh 0 0;
  font-size: 3.5vh;
}
.chart {
  flex: 1;
  min-height: 0;
  margin: 1vh 0;
}
</style>
