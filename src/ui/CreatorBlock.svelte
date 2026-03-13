<script lang="ts">
	import type { JiraIssue } from '../types';
	import { t } from '../i18n';
	import { statusColor } from '../constants';
	import StatusFilters from './StatusFilters.svelte';

	interface Props {
		project: string;
		reporter?: string;
		assignee?: string;
		labels: string[];
		issues: JiraIssue[];
		jiraUrl: string;
	}

	let { project, reporter, assignee, labels, issues, jiraUrl }: Props = $props();

	let statusColorMap = $derived.by(() => {
		const map: Record<string, string> = {};
		for (const issue of issues) {
			map[issue.fields.status.name] = issue.fields.status.statusCategory.colorName;
		}
		return map;
	});

	let projectKey = $derived(issues[0]?.fields.project.key ?? project);

	let allStatuses = $derived([...new Set(issues.map(i => i.fields.status.name))].sort());
	let allTypes = $derived([...new Set(issues.map(i => i.fields.issuetype.name))].sort());

	let activeStatuses = $state<Record<string, boolean>>({});
	let activeLabels = $state<Record<string, boolean>>({});
	let selectedType = $state('');

	let anyStatusActive = $derived(allStatuses.some(s => activeStatuses[s] ?? true));
	// Only the filter-list labels that have not been explicitly deactivated
	let activeFilterLabels = $derived(labels.filter(l => activeLabels[l] !== false));

	let visibleIssues = $derived.by(() => {
		let result = anyStatusActive
			? issues.filter(i => activeStatuses[i.fields.status.name] ?? true)
			: issues;

		if (selectedType) {
			result = result.filter(i => i.fields.issuetype.name === selectedType);
		}

		if (labels.length > 0 && activeFilterLabels.length > 0) {
			const issueLabels = (i: { fields: { labels?: string[] } }) =>
				new Set(i.fields.labels ?? []);
			result = result.filter(i => activeFilterLabels.some(l => issueLabels(i).has(l)));
		}

		return result;
	});

	function openUrl(url: string): void {
		window.open(url, '_blank');
	}
</script>

<div class="jira-creator-card">
	<!-- Header -->
	<div class="jira-creator-header">
		<div class="jira-creator-title-group">
			<a
				class="jira-creator-project"
				href="{jiraUrl}/jira/software/projects/{projectKey}/summary"
				onclick={(e) => { e.preventDefault(); openUrl(`${jiraUrl}/jira/software/projects/${projectKey}/summary`); }}
			>{project}</a>
			{#if reporter}
				<span class="jira-creator-separator">·</span>
				<span class="jira-creator-label">{t.reportedBy}</span>
				<span class="jira-creator-email">{reporter}</span>
			{:else if assignee}
				<span class="jira-creator-separator">·</span>
				<span class="jira-creator-label">{t.assignedTo}</span>
				<span class="jira-creator-email">{assignee}</span>
			{/if}
		</div>
		<span class="jira-creator-count">{t.items(visibleIssues.length)}</span>
	</div>

	{#if issues.length > 0}
		<!-- Filters -->
		<div class="jira-epic-filter">
			<StatusFilters
				statuses={allStatuses}
				colorMap={statusColorMap}
				{activeStatuses}
				onToggle={(s) => { activeStatuses[s] = !(activeStatuses[s] ?? true); }}
			/>

			{#if labels.length > 0}
				<div class="jira-epic-filter-row">
					<span class="jira-epic-filter-label">{t.labelsLabel}</span>
					<div class="jira-epic-status-filters">
						{#each labels as label}
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

			{#if allTypes.length > 1}
				<div class="jira-epic-filter-row">
					<span class="jira-epic-filter-label">{t.typeLabel}</span>
					<select class="jira-epic-filter-select" bind:value={selectedType}>
						<option value="">{t.allTypes}</option>
						{#each allTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>

		<!-- Issue list -->
		<div class="jira-epic-divider"></div>
		<div class="jira-epic-children">
			{#each visibleIssues as issue}
				{@const badgeColor = statusColor(issue.fields.status.statusCategory.colorName)}
				<div class="jira-epic-child-row">
					<a
						class="jira-epic-child-key"
						href="{jiraUrl}/browse/{issue.key}"
						onclick={(e) => { e.preventDefault(); openUrl(`${jiraUrl}/browse/${issue.key}`); }}
					>
						{issue.key}
					</a>
					<span class="jira-epic-child-summary">{issue.fields.summary}</span>
					<span class="jira-issue-type-badge">{issue.fields.issuetype.name}</span>
					<span class="jira-epic-child-badge" style="--jira-badge-color: {badgeColor}">
						{issue.fields.status.name}
					</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="jira-epic-hint">{t.noIssuesFound}</p>
	{/if}
</div>
