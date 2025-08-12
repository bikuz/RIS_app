<script lang="ts">
</script>

<!-- 3-Column Layout -->
<div class="grid grid-cols-12 items-stretch gap-8">
	<!-- Left Sidebar -->
	<div class="col-span-3 flex">
		<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
			<h3 class="mb-3 text-sm font-semibold text-slate-700">Climate Abstract</h3>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="col-span-6 flex">
		<div class="min-h-[600px] flex-1 rounded-xl border border-slate-200/50 bg-white shadow-sm">
			<!-- {@render children?.()} -->
		</div>
	</div>

	<!-- Right Sidebar -->
	<div class="col-span-3 flex">
		<div class="flex-1 rounded-xl border border-slate-200/50 bg-white p-4 shadow-sm">
			<h3 class="mb-3 text-sm font-semibold text-slate-700">Possible Questions</h3>
		</div>
	</div>
</div>
