<script lang="ts">
	import type { JiraApiSettings } from '../api/jira-client';
	import type { JiraIssue } from '../types';
	import { searchIssues, fetchIssuesByKeys } from '../api/jira-client';
	import { statusColor } from '../constants';
	import { t } from '../i18n';

	let { settings }: { settings: JiraApiSettings } = $props();

	interface PinnedItem {
		key: string;
		summary: string;
		projectKey: string;
		issuetypeName: string;
		statusName: string;
		statusColorName: string;
	}

	function storageKey(): string {
		return `crystalbear-pinned:${settings.jiraUrl}`;
	}

	function loadPinned(): PinnedItem[] {
		try {
			return JSON.parse(localStorage.getItem(storageKey()) ?? '[]') as PinnedItem[];
		} catch {
			return [];
		}
	}

	function savePinned(items: PinnedItem[]): void {
		localStorage.setItem(storageKey(), JSON.stringify(items));
	}

	let query = $state('');
	let loading = $state(false);
	let error = $state('');
	let results = $state<JiraIssue[]>([]);
	let searched = $state(false);
	let pinned = $state<PinnedItem[]>(loadPinned());
	let copiedKey = $state<string | null>(null);

	// Read keys directly from localStorage (not the reactive state) so the
	// effect below has no reactive dependencies and runs exactly once on mount.
	const initialPinnedKeys = loadPinned().map(p => p.key);

	$effect(() => {
		if (initialPinnedKeys.length === 0) return;
		void refreshPinnedStatuses(initialPinnedKeys);
	});

	async function refreshPinnedStatuses(keys: string[]): Promise<void> {
		try {
			const fresh = await fetchIssuesByKeys(settings, keys);
			const freshMap = new Map(fresh.map(i => [i.key, i]));
			const updated = pinned.map(p => {
				const issue = freshMap.get(p.key);
				if (!issue) return p;
				return {
					...p,
					statusName: issue.fields.status.name,
					statusColorName: issue.fields.status.statusCategory.colorName,
				};
			});
			pinned = updated;
			savePinned(updated);
		} catch {
			// silently fail — keep showing cached data
		}
	}

	function issueToPinned(issue: JiraIssue): PinnedItem {
		return {
			key: issue.key,
			summary: issue.fields.summary,
			projectKey: issue.fields.project.key,
			issuetypeName: issue.fields.issuetype.name,
			statusName: issue.fields.status.name,
			statusColorName: issue.fields.status.statusCategory.colorName,
		};
	}

	function isPinned(key: string): boolean {
		return pinned.some(p => p.key === key);
	}

	function togglePin(issue: JiraIssue): void {
		const next = isPinned(issue.key)
			? pinned.filter(p => p.key !== issue.key)
			: [...pinned, issueToPinned(issue)];
		pinned = next;
		savePinned(next);
	}

	function unpin(key: string): void {
		const next = pinned.filter(p => p.key !== key);
		pinned = next;
		savePinned(next);
	}

	async function copyKey(key: string): Promise<void> {
		await navigator.clipboard.writeText(key);
		copiedKey = key;
		setTimeout(() => { copiedKey = null; }, 1500);
	}

	function handleSearch(): void {
		const q = query.trim();
		if (q.length < 2) return;
		searched = true;
		void doSearch(q);
	}

	async function doSearch(q: string): Promise<void> {
		loading = true;
		error = '';
		results = [];
		try {
			results = await searchIssues(settings, q);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	// Group results: Project → Epic (parent) → issues
	type EpicGroup = { epicKey: string | null; epicSummary: string | null; issues: JiraIssue[] };
	type ProjectGroup = { projectKey: string; projectName: string; epics: EpicGroup[] };

	let grouped = $derived.by((): ProjectGroup[] => {
		const projectMap = new Map<string, ProjectGroup>();
		for (const issue of results) {
			const pk = issue.fields.project.key;
			if (!projectMap.has(pk)) {
				projectMap.set(pk, { projectKey: pk, projectName: issue.fields.project.name, epics: [] });
			}
			const pg = projectMap.get(pk)!;
			const epicKey = issue.fields.parent?.key ?? null;
			const epicSummary = issue.fields.parent?.fields.summary ?? null;
			let eg = pg.epics.find(e => e.epicKey === epicKey);
			if (!eg) {
				eg = { epicKey, epicSummary, issues: [] };
				pg.epics.push(eg);
			}
			eg.issues.push(issue);
		}
		return [...projectMap.values()];
	});

	function openUrl(key: string): void {
		window.open(`${settings.jiraUrl}/browse/${key}`, '_blank');
	}
</script>

<div class="jira-browse-panel">
	<div class="jira-browse-search">
		<input
			class="jira-browse-search-input"
			type="text"
			placeholder={t.searchPlaceholder}
			bind:value={query}
			onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
		/>
		<button
			class="jira-browse-search-btn"
			onclick={handleSearch}
			disabled={query.trim().length < 2}
		>{t.searchButton}</button>
	</div>

	<div class="jira-browse-list">
		<!-- Pinned section -->
		{#if pinned.length > 0}
			<div class="jira-browse-section-header">{t.pinnedSection}</div>
			{#each pinned as item (item.key)}
				{@const badgeColor = statusColor(item.statusColorName)}
				<div class="jira-browse-pinned-row">
					<div class="jira-browse-pinned-top">
						<a
							class="jira-browse-key"
							href="{settings.jiraUrl}/browse/{item.key}"
							onclick={(e) => { e.preventDefault(); openUrl(item.key); }}
						>{item.key}</a>
						<span class="jira-browse-name">{item.summary}</span>
					</div>
					<div class="jira-browse-pinned-meta">
						<span class="jira-issue-type-badge">{item.issuetypeName}</span>
						<span class="jira-browse-badge" style:background={badgeColor}>{item.statusName}</span>
						<button
							class="jira-browse-copy-btn"
							class:jira-browse-copy-btn--done={copiedKey === item.key}
							onclick={() => { void copyKey(item.key); }}
							title={t.copyKey}
						>
							{#if copiedKey === item.key}
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
							{:else}
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
							{/if}
						</button>
						<button class="jira-browse-pin-btn jira-browse-pin-btn--active" onclick={() => unpin(item.key)} title={t.unpin}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 1a1 1 0 0 0-1 1v1H9V2a1 1 0 0 0-2 0v1.17A3 3 0 0 0 5 6v1a1 1 0 0 0 1 1h5v8l-2 3h8l-2-3V8h5a1 1 0 0 0 1-1V6a3 3 0 0 0-2-2.83V2a1 1 0 0 0-1-1z"/></svg>
						</button>
					</div>
				</div>
			{/each}
			<div class="jira-epic-divider"></div>
		{/if}

		<!-- Search results -->
		{#if loading}
			<p class="jira-loading">{t.loading}</p>
		{:else if error}
			<p class="jira-error">{error}</p>
		{:else if !searched}
			<p class="jira-browse-hint">{t.searchHint}</p>
		{:else if results.length === 0}
			<p class="jira-empty">{t.noIssuesFound}</p>
		{:else}
			<div class="jira-browse-section-header">{t.searchResults}</div>
			{#each grouped as pg (pg.projectKey)}
				<div class="jira-browse-project-header">
					<span class="jira-browse-project-key">{pg.projectKey}</span>
					<span class="jira-browse-project-name">{pg.projectName}</span>
				</div>
				{#each pg.epics as eg}
					{#if eg.epicKey}
						<div class="jira-browse-epic-header">
							<a
								class="jira-browse-epic-key"
								href="{settings.jiraUrl}/browse/{eg.epicKey}"
								onclick={(e) => { e.preventDefault(); openUrl(eg.epicKey!); }}
							>{eg.epicKey}</a>
							<span class="jira-browse-epic-name">{eg.epicSummary}</span>
						</div>
					{:else}
						<div class="jira-browse-epic-header jira-browse-epic-header--none">
							<span class="jira-browse-epic-name jira-browse-epic-name--none">{t.noEpic}</span>
						</div>
					{/if}
					{#each eg.issues as issue (issue.id)}
						{@const badgeColor = statusColor(issue.fields.status.statusCategory.colorName)}
						<div class="jira-browse-issue-card">
							<div class="jira-browse-issue-card-top">
								<a
									class="jira-browse-key"
									href="{settings.jiraUrl}/browse/{issue.key}"
									onclick={(e) => { e.preventDefault(); openUrl(issue.key); }}
								>{issue.key}</a>
								<span class="jira-browse-name">{issue.fields.summary}</span>
							</div>
							<div class="jira-browse-issue-card-meta">
								<span class="jira-issue-type-badge">{issue.fields.issuetype.name}</span>
								<span class="jira-browse-badge" style:background={badgeColor}>{issue.fields.status.name}</span>
								<button
									class="jira-browse-pin-btn"
									class:jira-browse-pin-btn--active={isPinned(issue.key)}
									onclick={() => togglePin(issue)}
									title={isPinned(issue.key) ? t.unpin : t.pin}
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 1a1 1 0 0 0-1 1v1H9V2a1 1 0 0 0-2 0v1.17A3 3 0 0 0 5 6v1a1 1 0 0 0 1 1h5v8l-2 3h8l-2-3V8h5a1 1 0 0 0 1-1V6a3 3 0 0 0-2-2.83V2a1 1 0 0 0-1-1z"/></svg>
								</button>
							</div>
						</div>
					{/each}
				{/each}
			{/each}
		{/if}
	</div>
</div>
