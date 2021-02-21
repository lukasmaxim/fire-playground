<template>
  <div class="container">
    <Perimeter :pid="'1'" :perimeterSample='this.perimeterSample'/>
    <Perimeter :pid="'2'" :perimeterSample='this.perimeterSample'/>
    <Perimeter :pid="'3'" :perimeterSample='this.perimeterSample'/>
    <Perimeter :pid="'4'" :perimeterSample='this.perimeterSample'/>
    <Perimeter :pid="'5'" :perimeterSample='this.perimeterSample'/>
    <Perimeter :pid="'6'" :perimeterSample='this.perimeterSample'/>
  </div>
</template>

<script>
import Perimeter from './Perimeter.vue'

export default {
  name: 'PerimeterTimeline',
  props: {
    perimeterSample: Array
  },
  components: {
    Perimeter
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: grey;
  height: 1000px;
  width: 100%;
}
</style>