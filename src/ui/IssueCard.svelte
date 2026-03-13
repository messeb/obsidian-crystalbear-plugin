<script lang="ts">
	import type { JiraIssue } from '../types';
	import { statusColor } from '../constants';
	import { t } from '../i18n';

	let { issue, jiraUrl }: { issue: JiraIssue; jiraUrl: string } = $props();

	const badgeColor = $derived(statusColor(issue.fields.status.statusCategory.colorName));

	let copied = $state(false);

	function openIssue(e: MouseEvent): void {
		e.preventDefault();
		window.open(`${jiraUrl}/browse/${issue.key}`, '_blank');
	}

	async function copyKey(): Promise<void> {
		await navigator.clipboard.writeText(issue.key);
		copied = true;
		setTimeout(() => { copied = false; }, 1500);
	}
</script>

<div class="jira-dash-card">
	<div class="jira-dash-card-top">
		<a class="jira-dash-card-key" href={`${jiraUrl}/browse/${issue.key}`} onclick={openIssue}>
			{issue.key}
		</a>
		<span class="jira-dash-card-summary">{issue.fields.summary}</span>
		<button class="jira-dash-card-copy" class:jira-dash-card-copy--done={copied} onclick={copyKey} title={t.copyKey}>
			{#if copied}
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
			{:else}
				<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
			{/if}
		</button>
	</div>
	<div class="jira-dash-card-meta">
		<span class="jira-dash-badge jira-dash-badge--status" style:background={badgeColor}>
			{issue.fields.status.name}
		</span>
		<span class="jira-dash-badge jira-dash-badge--type">{issue.fields.issuetype.name}</span>
		<span class="jira-dash-badge jira-dash-badge--priority">{issue.fields.priority.name}</span>
		<span class="jira-dash-badge jira-dash-badge--project">{issue.fields.project.key}</span>
	</div>
</div>
