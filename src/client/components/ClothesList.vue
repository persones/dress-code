<script setup>
defineProps({
  clothes: { type: Array, required: true },
});
</script>

<template>
  <div class="clothes">
    <figure v-for="item in clothes" :key="item.name" class="tile">
      <img :src="item.image" :alt="item.name" />
      <figcaption>{{ item.name }}</figcaption>
    </figure>
    <p v-if="!clothes.length" class="none">No suggestion</p>
  </div>
</template>

<style scoped>
.clothes {
  display: flex;
  gap: 2vh;
  min-height: 20vh;
}
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  padding: 1.5vh;
  background: var(--bg);
  border-radius: var(--radius);
}
.tile img {
  width: 14vh;
  height: 14vh;
}
figcaption {
  margin-top: 0.5vh;
  font-size: 2.6vh;
  font-weight: 600;
  text-transform: capitalize;
}
.none {
  align-self: center;
  font-size: 3vh;
  color: var(--muted);
}
</style>
