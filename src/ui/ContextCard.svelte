<script lang="ts">
	import type { JiraApiSettings } from '../api/jira-client';
	import type { JiraIssueDetail } from '../types';
	import { fetchJiraIssue } from '../api/jira-client';
	import { statusColor } from '../constants';
	import { t } from '../i18n';

	let {
		issueKey,
		settings,
		onDismiss,
	}: {
		issueKey: string;
		settings: JiraApiSettings;
		onDismiss: () => void;
	} = $props();

	let issue = $state<JiraIssueDetail | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		issue = null;
		loading = true;
		error = '';
		void fetchJiraIssue(settings, issueKey).then(
			r => { issue = r; loading = false; },
			e => { error = e instanceof Error ? e.message : String(e); loading = false; },
		);
	});

	let badgeColor = $derived(issue ? statusColor(issue.fields.status.statusCategory.colorName) : '#42526e');

	function openIssue(): void {
		window.open(`${settings.jiraUrl}/browse/${issueKey}`, '_blank');
	}
</script>

<div class="jira-ctx-card">
	<div class="jira-ctx-header">
		<span class="jira-ctx-label">{t.activeNote}</span>
		<button class="jira-ctx-dismiss" onclick={onDismiss}>×</button>
	</div>
	{#if loading}
		<p class="jira-ctx-loading">{t.loading}</p>
	{:else if error}
		<p class="jira-ctx-error">{error}</p>
	{:else if issue}
		<button class="jira-ctx-issue" onclick={openIssue}>
			<span class="jira-ctx-key">{issue.key}</span>
			<span class="jira-ctx-summary">{issue.fields.summary}</span>
			<span class="jira-ctx-badge" style:background={badgeColor}>{issue.fields.status.name}</span>
		</button>
	{/if}
</div>
