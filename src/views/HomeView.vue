<template>
  <div id="home">
    <ToolBar/>
    <FileList/>
  </div>
</template>

<script setup lang="ts">
import FileList from '@/components/FileList.vue'
import ToolBar from '@/components/ToolBar.vue'
import { change_folder } from '@/services/folder_service'
change_folder(0)
</script>

<style>
@import url("../assets/css/HomeView.css");
</style>
