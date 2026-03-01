<script lang="ts">
	import type { JiraIssueDetail, JiraChildIssue } from '../types';
	import { t } from '../i18n';
	import { statusColor } from '../constants';
	import StatusFilters from './StatusFilters.svelte';

	interface Props {
		issue: JiraIssueDetail;
		children: JiraChildIssue[];
		jiraUrl: string;
		storyPointsField?: string;
	}

	let { issue, children, jiraUrl, storyPointsField = 'customfield_10016' }: Props = $props();

	let isEpic = $derived(issue.fields.issuetype.name.toLowerCase() === 'epic');
	let epicBadgeColor = $derived(statusColor(issue.fields.status.statusCategory.colorName));

	let statusColorMap = $derived.by(() => {
		const map: Record<string, string> = {};
		for (const child of children) {
			map[child.fields.status.name] = child.fields.status.statusCategory.colorName;
		}
		return map;
	});

	let allStatuses = $derived([...new Set(children.map(c => c.fields.status.name))].sort());
	let allVersions = $derived(
		[...new Set(children.flatMap(c => c.fields.fixVersions.map(v => v.name)))].sort(),
	);

	// Progress — derived entirely from children array
	let totalCount = $derived(children.length);
	let totalDone = $derived(
		children.filter(c => c.fields.status.statusCategory.key === 'done').length,
	);
	let openCount = $derived(totalCount - totalDone);
	let pct = $derived(totalCount > 0 ? Math.round((totalDone / totalCount) * 100) : 0);

	// Filter state
	let activeStatuses = $state<Record<string, boolean>>({});
	let selectedVersion = $state('');

	const VERSION_NONE = '__none__';

	let hasUnversioned = $derived(children.some(c => c.fields.fixVersions.length === 0));

	let anyStatusActive = $derived(allStatuses.some(s => activeStatuses[s] ?? true));

	let visibleChildren = $derived(
		children.filter(c =>
			(!anyStatusActive || (activeStatuses[c.fields.status.name] ?? true)) &&
			(
				!selectedVersion ||
				(selectedVersion === VERSION_NONE
					? c.fields.fixVersions.length === 0
					: c.fields.fixVersions.some(v => v.name === selectedVersion))
			),
		),
	);

	// Story points
	function getSP(child: JiraChildIssue): number | null {
		const val = child.fields[storyPointsField];
		return typeof val === 'number' ? val : null;
	}

	let totalSP = $derived(
		visibleChildren.reduce((sum, c) => sum + (getSP(c) ?? 0), 0),
	);

	function toggleStatus(status: string): void {
		activeStatuses[status] = !(activeStatuses[status] ?? true);
	}

	function openUrl(url: string): void {
		window.open(url, '_blank');
	}

	// Extract plain text from Atlassian Document Format (ADF)
	function adfToText(node: unknown): string {
		if (!node || typeof node !== 'object') return '';
		const n = node as { type?: string; text?: string; content?: unknown[] };
		if (n.type === 'text' && typeof n.text === 'string') return n.text;
		if (Array.isArray(n.content)) return n.content.map(adfToText).join('').replace(/\s+/g, ' ');
		return '';
	}

	let descriptionPreview = $derived.by(() => {
		const text = adfToText(issue.fields.description).trim();
		return text.length > 100 ? text.slice(0, 100) + '…' : text;
	});
</script>

<div class="jira-epic-card">
	<!-- Header -->
	<div class="jira-epic-header">
		<div class="jira-epic-title-group">
			<a
				class="jira-epic-key"
				href="{jiraUrl}/browse/{issue.key}"
				onclick={(e) => { e.preventDefault(); openUrl(`${jiraUrl}/browse/${issue.key}`); }}
			>
				{issue.key}
			</a>
			<span class="jira-epic-summary">{issue.fields.summary}</span>
		</div>
		<div class="jira-epic-header-badges">
			<span class="jira-issue-type-badge">{issue.fields.issuetype.name}</span>
			<span class="jira-epic-status-badge" style="--jira-badge-color: {epicBadgeColor}">
				{issue.fields.status.name}
			</span>
		</div>
	</div>

	{#if descriptionPreview}
		<div class="jira-epic-description">{descriptionPreview}</div>
	{/if}

	{#if isEpic}
		<!-- Progress -->
		<div class="jira-epic-progress">
			<div class="jira-epic-progress-label">
				<span>{t.openCount(openCount)}</span>
				<span>{t.totalCount(totalCount)}</span>
			</div>
			<div class="jira-epic-bar">
				<div class="jira-epic-bar-fill" style="--jira-progress: {pct}%"></div>
			</div>
		</div>

		{#if children.length > 0}
			<!-- Filters -->
			<div class="jira-epic-divider"></div>
			<div class="jira-epic-filter">
				<StatusFilters
					statuses={allStatuses}
					colorMap={statusColorMap}
					{activeStatuses}
					onToggle={toggleStatus}
				/>

				{#if allVersions.length > 0 || hasUnversioned}
					<div class="jira-epic-filter-row">
						<span class="jira-epic-filter-label">{t.fixVersions}</span>
						<select class="jira-epic-filter-select" bind:value={selectedVersion}>
							<option value="">{t.allVersions}</option>
							{#each allVersions as version}
								<option value={version}>{version}</option>
							{/each}
							{#if hasUnversioned}
								<option value={VERSION_NONE}>{t.noneVersion}</option>
							{/if}
						</select>
					</div>
				{/if}
			</div>

			<!-- Child list -->
			<div class="jira-epic-divider"></div>
			<div class="jira-epic-children">
				{#each visibleChildren as child}
					{@const childColor = statusColor(child.fields.status.statusCategory.colorName)}
					{@const sp = getSP(child)}
					<div class="jira-epic-child-row">
						<a
							class="jira-epic-child-key"
							href="{jiraUrl}/browse/{child.key}"
							onclick={(e) => { e.preventDefault(); openUrl(`${jiraUrl}/browse/${child.key}`); }}
						>
							{child.key}
						</a>
						<span class="jira-epic-child-summary">{child.fields.summary}</span>
						{#if sp !== null}
							<span class="jira-epic-child-sp">{sp}</span>
						{/if}
						<span class="jira-epic-child-badge" style="--jira-badge-color: {childColor}">
							{child.fields.status.name}
						</span>
						</div>
				{/each}
			</div>

			<!-- Story points total -->
			{#if totalSP > 0}
				<div class="jira-epic-divider"></div>
				<div class="jira-epic-sp-total">
					<span class="jira-epic-sp-total-label">{t.totalStoryPoints}</span>
					<span class="jira-epic-sp-total-value">{totalSP}</span>
				</div>
			{/if}
		{/if}
	{:else}
		<!-- Non-epic: story points + fix version -->
		{@const issueSP = issue.fields[storyPointsField]}
		{#if typeof issueSP === 'number' || issue.fields.fixVersions.length > 0}
			<div class="jira-fix-versions">
				{#if typeof issueSP === 'number'}
					<span class="jira-fix-versions-label">{t.storyPoints}</span>
					<span class="jira-epic-child-sp">{issueSP}</span>
				{/if}
				{#if issue.fields.fixVersions.length > 0}
					<span class="jira-fix-versions-label">{t.fixVersion}</span>
					{#each issue.fields.fixVersions as version}
						<span class="jira-fix-version-badge">{version.name}</span>
					{/each}
				{/if}
			</div>
		{/if}

		<!-- Non-epic: epic parent link -->
		{#if issue.fields.parent}
			<div class="jira-fix-versions">
				<span class="jira-fix-versions-label">{t.epicLabel}</span>
				<a
					class="jira-issue-parent-link"
					href="{jiraUrl}/browse/{issue.fields.parent.key}"
					onclick={(e) => { e.preventDefault(); openUrl(`${jiraUrl}/browse/${issue.fields.parent!.key}`); }}
				>{issue.fields.parent.key} – {issue.fields.parent.fields.summary}</a>
			</div>
		{/if}
	{/if}
</div>
