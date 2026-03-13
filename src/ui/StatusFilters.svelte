<script lang="ts">
	import { statusColor } from '../constants';
	import { t } from '../i18n';

	let {
		statuses,
		colorMap,
		activeStatuses,
		onToggle,
	}: {
		statuses: string[];
		colorMap: Record<string, string>;
		activeStatuses: Record<string, boolean>;
		onToggle: (status: string) => void;
	} = $props();
</script>

<div class="jira-epic-filter-row">
	<span class="jira-epic-filter-label">{t.stateLabel}</span>
	<div class="jira-epic-status-filters">
		{#each statuses as status}
			{@const color = statusColor(colorMap[status] ?? '')}
			{@const isActive = activeStatuses[status] ?? true}
			<button
				class="jira-status-toggle"
				class:jira-status-toggle--active={isActive}
				style="--status-color: {color}"
				onclick={() => onToggle(status)}
			>
				{status}
			</button>
		{/each}
	</div>
</div>
