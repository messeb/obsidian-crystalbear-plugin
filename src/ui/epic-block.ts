import { MarkdownRenderChild, type MarkdownPostProcessorContext } from 'obsidian';
import { mount, unmount } from 'svelte';
import { fetchEpicChildren, fetchIssuesByProject, fetchIssuesByKeys, fetchJiraIssue, type JiraApiSettings } from '../api/jira-client';
import type { JiraChildIssue } from '../types';
import JiraBlock from './JiraBlock.svelte';
import CreatorBlock from './CreatorBlock.svelte';
import ItemListBlock from './ItemListBlock.svelte';
import type JiraPlugin from '../main';
import { t } from '../i18n';

type BlockParams =
	| { type: 'issue'; key: string }
	| { type: 'project'; project: string; reporter?: string; assignee?: string; labels: string[] }
	| { type: 'list'; name: string; keys: string[]; filterLabels: string[] };

export function parseBlockSource(source: string): BlockParams {
	const lines = source.split('\n').map(l => l.trim()).filter(Boolean);
	const kvMap: Record<string, string> = {};
	let allKV = lines.length > 0;

	for (const line of lines) {
		const m = /^(\w+)\s*:\s*(.+)$/.exec(line);
		if (m?.[1] && m[2]) {
			kvMap[m[1].toLowerCase()] = m[2].trim();
		} else {
			allKV = false;
			break;
		}
	}

	if (allKV && kvMap['name'] && kvMap['items']) {
		const keys = kvMap['items'].split(',').map(k => k.trim()).filter(Boolean);
		const filterLabels = kvMap['labels']
			? kvMap['labels'].split(',').map(l => l.trim()).filter(Boolean)
			: [];
		return { type: 'list', name: kvMap['name'], keys, filterLabels };
	}

	if (allKV && kvMap['project']) {
		const labels = kvMap['labels']
			? kvMap['labels'].split(',').map(l => l.trim()).filter(Boolean)
			: [];
		return {
			type: 'project',
			project: kvMap['project'],
			reporter: kvMap['reporter'],
			assignee: kvMap['assignee'],
			labels,
		};
	}

	return { type: 'issue', key: lines[0] ?? '' };
}

export function registerJiraCodeBlock(plugin: JiraPlugin): void {
	plugin.registerMarkdownCodeBlockProcessor('jira', (source, el, ctx) => {
		void renderJiraBlock(el, source.trim(), plugin, ctx);
	});
}

async function renderJiraBlock(
	el: HTMLElement,
	source: string,
	plugin: JiraPlugin,
	ctx: MarkdownPostProcessorContext,
): Promise<void> {
	el.empty();

	const settings: JiraApiSettings = {
		jiraUrl: plugin.settings.jiraUrl,
		jiraEmail: plugin.app.secretStorage.getSecret(plugin.settings.jiraEmailSecret) ?? '',
		jiraApiToken: plugin.app.secretStorage.getSecret(plugin.settings.jiraApiTokenSecret) ?? '',
		maxResults: plugin.settings.maxResults,
		storyPointsField: plugin.settings.storyPointsField,
	};

	if (!source) {
		el.createEl('p', { text: t.hintProvideQuery, cls: 'jira-epic-hint' });
		return;
	}

	const params = parseBlockSource(source);
	const wrapper = el.createDiv({ cls: 'jira-epic-wrapper' });
	wrapper.createEl('span', { text: t.loading, cls: 'jira-loading' });

	try {
		if (params.type === 'list') {
			const issues = params.keys.length > 0
				? await fetchIssuesByKeys(settings, params.keys)
				: [];
			wrapper.empty();

			const component = mount(ItemListBlock, {
				target: wrapper,
				props: {
					name: params.name,
					keys: params.keys,
					filterLabels: params.filterLabels,
					issues,
					jiraUrl: settings.jiraUrl,
					storyPointsField: settings.storyPointsField,
				},
			});

			ctx.addChild(new JiraBlockChild(el, component));
		} else if (params.type === 'project') {
			const result = await fetchIssuesByProject(settings, params.project, {
				reporter: params.reporter,
				assignee: params.assignee,
				labels: params.labels,
			});
			wrapper.empty();

			const component = mount(CreatorBlock, {
				target: wrapper,
				props: {
					project: params.project,
					reporter: params.reporter,
					assignee: params.assignee,
					labels: params.labels,
					issues: result.issues,
					jiraUrl: settings.jiraUrl,
				},
			});

			ctx.addChild(new JiraBlockChild(el, component));
		} else {
			// type === 'issue'
			if (!params.key) {
				wrapper.empty();
				wrapper.createEl('p', { text: t.hintProvideKey, cls: 'jira-epic-hint' });
				return;
			}

			const issue = await fetchJiraIssue(settings, params.key, settings.storyPointsField);
			let children: JiraChildIssue[] = [];

			if (issue.fields.issuetype.name.toLowerCase() === 'epic') {
				const childResult = await fetchEpicChildren(settings, params.key, settings.storyPointsField);
				children = childResult.issues;
			}

			wrapper.empty();

			const component = mount(JiraBlock, {
				target: wrapper,
				props: {
					issue,
					children,
					jiraUrl: settings.jiraUrl,
					storyPointsField: settings.storyPointsField,
				},
			});

			ctx.addChild(new JiraBlockChild(el, component));
		}
	} catch (err) {
		wrapper.empty();
		wrapper.createEl('p', {
			text: `Error: ${err instanceof Error ? err.message : String(err)}`,
			cls: 'jira-epic-error',
		});
	}
}

class JiraBlockChild extends MarkdownRenderChild {
	private component: Record<string, unknown>;

	constructor(el: HTMLElement, component: Record<string, unknown>) {
		super(el);
		this.component = component;
	}

	onunload(): void {
		void unmount(this.component);
	}
}

