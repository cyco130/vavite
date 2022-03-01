<script setup lang="ts">
import Nav from "./components/Nav.vue";
</script>

<template>
	<div>
		<aside>
			<Nav />
		</aside>
		<slot></slot>
	</div>
</template>
