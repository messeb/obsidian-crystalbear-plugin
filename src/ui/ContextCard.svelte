<script lang="ts">
	import type { JiraApiSettings } from '../api/jira-client';
	import type { JiraIssueDetail } from '../types';
	import { fetchJiraIssue } from '../api/jira-client';
	import { statusColor } from '../constants';
	import { t } from '../i18n';
	import { classifyError } from '../error-utils';

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
	let errorTitle = $state('');
	let errorDesc = $state('');

	$effect(() => {
		issue = null;
		loading = true;
		errorTitle = '';
		errorDesc = '';
		void fetchJiraIssue(settings, issueKey).then(
			r => { issue = r; loading = false; },
			e => {
				const classified = classifyError(e, issueKey);
				errorTitle = classified.title;
				errorDesc = classified.description;
				loading = false;
			},
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
	{:else if errorTitle}
		<div class="jira-ctx-error-body">
			<span class="jira-ctx-error-title">{errorTitle}</span>
			<span class="jira-ctx-error-desc">{errorDesc}</span>
		</div>
	{:else if issue}
		<button class="jira-ctx-issue" onclick={openIssue}>
			<span class="jira-ctx-key">{issue.key}</span>
			<span class="jira-ctx-summary">{issue.fields.summary}</span>
			<span class="jira-ctx-badge" style:background={badgeColor}>{issue.fields.status.name}</span>
		</button>
	{/if}
</div>
