<script lang="ts">
	import type { JiraIssue } from '../types';
	import { t } from '../i18n';
	import { statusColor } from '../constants';

	interface Props {
		name: string;
		keys: string[];
		filterLabels: string[];
		issues: JiraIssue[];
		jiraUrl: string;
		storyPointsField?: string;
	}

	let { name, keys, filterLabels, issues, jiraUrl, storyPointsField = 'customfield_10016' }: Props = $props();

	// Preserve the user-specified order from the items list
	let orderedIssues = $derived.by(() => {
		const map = new Map(issues.map(i => [i.key, i]));
		return keys.map(k => map.get(k)).filter((i): i is JiraIssue => i !== undefined);
	});

	let statusColorMap = $derived.by(() => {
		const map: Record<string, string> = {};
		for (const issue of orderedIssues) {
			map[issue.fields.status.name] = issue.fields.status.statusCategory.colorName;
		}
		return map;
	});

	let allStatuses = $derived([...new Set(orderedIssues.map(i => i.fields.status.name))].sort());

	// Filter state — missing key means active (true)
	let activeStatuses = $state<Record<string, boolean>>({});
	let activeLabels = $state<Record<string, boolean>>({});

	let visibleIssues = $derived.by(() => {
		const anyStatusActive = allStatuses.some(s => activeStatuses[s] ?? true);
		let result = anyStatusActive
			? orderedIssues.filter(i => activeStatuses[i.fields.status.name] ?? true)
			: orderedIssues;

		if (filterLabels.length > 0) {
			const active = filterLabels.filter(l => activeLabels[l] ?? true);
			if (active.length > 0) {
				result = result.filter(i =>
					i.fields.labels?.some(l => active.includes(l)) ?? false,
				);
			}
		}

		return result;
	});

	let hasSP = $derived(orderedIssues.some(i => (i.fields as Record<string, unknown>)[storyPointsField] != null));
	let totalSP = $derived(
		visibleIssues.reduce((sum, i) => {
			const val = (i.fields as Record<string, unknown>)[storyPointsField];
			return sum + ((val as number | null | undefined) ?? 0);
		}, 0),
	);

	function openUrl(url: string): void {
		window.open(url, '_blank');
	}
</script>

<div class="jira-list-card">
	<div class="jira-list-header">
		<span class="jira-list-name">{name}</span>
		<span class="jira-list-count">{t.items(issues.length)}</span>
	</div>

	{#if orderedIssues.length > 0}
		<div class="jira-list-filters">
			<div class="jira-list-filter-row">
				<span class="jira-list-filter-label">{t.stateLabel}</span>
				<div class="jira-epic-status-filters">
					{#each allStatuses as status}
						{@const colorName = statusColorMap[status] ?? ''}
						{@const color = statusColor(colorName)}
						{@const isActive = activeStatuses[status] ?? true}
						<button
							class="jira-status-toggle"
							class:jira-status-toggle--active={isActive}
							style="--status-color: {color}"
							onclick={() => { activeStatuses[status] = !(activeStatuses[status] ?? true); }}
						>
							{status}
						</button>
					{/each}
				</div>
			</div>

			{#if filterLabels.length > 0}
				<div class="jira-list-filter-row">
					<span class="jira-list-filter-label">{t.labelsLabel}</span>
					<div class="jira-epic-status-filters">
						{#each filterLabels as label}
							{@const isActive = activeLabels[label] ?? true}
							<button
								class="jira-status-toggle"
								class:jira-status-toggle--active={isActive}
								onclick={() => { activeLabels[label] = !(activeLabels[label] ?? true); }}
							>
								{label}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="jira-list-divider"></div>

		<div class="jira-epic-children">
			{#each visibleIssues as issue}
				{@const badgeColor = statusColor(issue.fields.status.statusCategory.colorName)}
				{@const sp = (issue.fields as Record<string, unknown>)[storyPointsField] as number | null | undefined}
				<div class="jira-epic-child-row">
					<a
						class="jira-epic-child-key"
						href="{jiraUrl}/browse/{issue.key}"
						onclick={(e) => { e.preventDefault(); openUrl(`${jiraUrl}/browse/${issue.key}`); }}
					>
						{issue.key}
					</a>
					<span class="jira-epic-child-summary">{issue.fields.summary}</span>
					{#if sp != null}
						<span class="jira-sp-badge">{sp}</span>
					{/if}
					<span class="jira-epic-child-badge" style="--jira-badge-color: {badgeColor}">
						{issue.fields.status.name}
					</span>
				</div>
			{/each}
		</div>

		{#if hasSP}
			<div class="jira-list-divider"></div>
			<div class="jira-list-total">
				<span class="jira-list-total-label">{t.totalStoryPoints}</span>
				<span class="jira-sp-badge">{totalSP}</span>
			</div>
		{/if}
	{:else}
		<p class="jira-epic-hint">{t.noIssuesFound}</p>
	{/if}
</div>
