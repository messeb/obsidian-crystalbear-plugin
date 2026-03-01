<script lang="ts">
	import type { JiraApiSettings } from '../api/jira-client';
	import type { JiraIssue } from '../types';
	import { fetchJiraIssues } from '../api/jira-client';
	import { t } from '../i18n';
	import IssueCard from './IssueCard.svelte';

	let { settings }: { settings: JiraApiSettings } = $props();

	let loading = $state(true);
	let error = $state('');
	let issues = $state<JiraIssue[]>([]);

	let countByCategory = $derived.by(() => {
		const m: Record<string, number> = {};
		for (const i of issues) {
			const k = i.fields.status.statusCategory.key;
			m[k] = (m[k] ?? 0) + 1;
		}
		return m;
	});
	let projectCount = $derived(new Set(issues.map(i => i.fields.project.key)).size);

	$effect(() => {
		void load();
	});

	async function load(): Promise<void> {
		loading = true;
		error = '';
		try {
			issues = await fetchJiraIssues(settings);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="jira-dash-panel">
	<div class="jira-dash-stats">
		<div class="jira-dash-stat-card">
			<span class="jira-dash-stat-value">{issues.length}</span>
			<span class="jira-dash-stat-label">{t.totalIssues}</span>
		</div>
		<div class="jira-dash-stat-card">
			<span class="jira-dash-stat-value">{projectCount}</span>
			<span class="jira-dash-stat-label">{t.projectsSection}</span>
		</div>
		<div class="jira-dash-stat-card jira-dash-stat-card--todo">
			<span class="jira-dash-stat-value">{countByCategory['new'] ?? 0}</span>
			<span class="jira-dash-stat-label">{t.toDo}</span>
		</div>
		<div class="jira-dash-stat-card jira-dash-stat-card--inprogress">
			<span class="jira-dash-stat-value">{countByCategory['indeterminate'] ?? 0}</span>
			<span class="jira-dash-stat-label">{t.inProgress}</span>
		</div>
	</div>

	<div class="jira-dash-list">
		{#if loading}
			<p class="jira-loading">{t.loadingIssues}</p>
		{:else if error}
			<p class="jira-error">{error}</p>
		{:else if issues.length === 0}
			<p class="jira-empty">{t.noIssuesFound}</p>
		{:else}
			{#each issues as issue (issue.id)}
				<IssueCard {issue} jiraUrl={settings.jiraUrl} />
			{/each}
		{/if}
	</div>
</div>
