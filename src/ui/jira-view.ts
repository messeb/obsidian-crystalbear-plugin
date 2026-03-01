import { ItemView, MarkdownView, type WorkspaceLeaf, type Editor } from 'obsidian';
import { mount, unmount } from 'svelte';
import type JiraPlugin from '../main';
import { t } from '../i18n';
import { type JiraApiSettings } from '../api/jira-client';
import BrowserPanel from './BrowserPanel.svelte';
import DashboardPanel from './DashboardPanel.svelte';
import ContextCard from './ContextCard.svelte';

export const JIRA_VIEW_TYPE = 'jira-issues-view';

const JIRA_KEY_RE = /^[A-Z][A-Z0-9]+-\d+$/i;

type ActiveTab = 'dashboard' | 'browse';

export class JiraIssuesView extends ItemView {
	private plugin: JiraPlugin;
	private activeTab: ActiveTab = 'dashboard';
	private browserComponent: Record<string, unknown> | null = null;
	private dashboardComponent: Record<string, unknown> | null = null;
	private contextKey: string | null = null;
	private contextDismissed = false;
	private contextComponent: Record<string, unknown> | null = null;
	private contextContainer: HTMLElement | null = null;
	private lastEditor: Editor | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: JiraPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return JIRA_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'CrystalBear'; // eslint-disable-line obsidianmd/ui/sentence-case
	}

	getIcon(): string {
		return 'crystalbear';
	}

	private resolveApiSettings(): JiraApiSettings {
		const s = this.plugin.settings;
		return {
			jiraUrl: s.jiraUrl,
			jiraEmail: this.app.secretStorage.getSecret(s.jiraEmailSecret) ?? '',
			jiraApiToken: this.app.secretStorage.getSecret(s.jiraApiTokenSecret) ?? '',
			maxResults: s.maxResults,
			storyPointsField: s.storyPointsField,
		};
	}

	async onOpen(): Promise<void> {
		const current = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (current) {
			this.lastEditor = current.editor;
			const file = current.file;
			if (file && JIRA_KEY_RE.test(file.basename)) {
				this.contextKey = file.basename.toUpperCase();
			}
		}

		this.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf?.view instanceof MarkdownView) {
					this.lastEditor = leaf.view.editor;
					const file = leaf.view.file;
					const newKey = file && JIRA_KEY_RE.test(file.basename)
						? file.basename.toUpperCase()
						: null;
					if (newKey !== this.contextKey) {
						this.contextKey = newKey;
						this.contextDismissed = false;
						this.updateContextCard();
					}
				}
			}),
		);

		void this.render();
	}

	onClose(): Promise<void> {
		this.unmountAll();
		this.contentEl.empty();
		return Promise.resolve();
	}

	private unmountAll(): void {
		if (this.browserComponent) {
			void unmount(this.browserComponent);
			this.browserComponent = null;
		}
		if (this.dashboardComponent) {
			void unmount(this.dashboardComponent);
			this.dashboardComponent = null;
		}
		if (this.contextComponent) {
			void unmount(this.contextComponent);
			this.contextComponent = null;
		}
		this.contextContainer = null;
	}

	private updateContextCard(): void {
		if (!this.contextContainer) return;
		if (this.contextComponent) {
			void unmount(this.contextComponent);
			this.contextComponent = null;
		}
		this.contextContainer.empty();
		if (this.contextKey && !this.contextDismissed) {
			this.contextComponent = mount(ContextCard, {
				target: this.contextContainer,
				props: {
					issueKey: this.contextKey,
					settings: this.resolveApiSettings(),
					onDismiss: () => {
						this.contextDismissed = true;
						this.updateContextCard();
					},
				},
			}) as Record<string, unknown>;
		}
	}

	private async render(): Promise<void> {
		this.unmountAll();
		const { contentEl } = this;
		contentEl.empty();

		const header = contentEl.createDiv({ cls: 'jira-header' });
		header.createEl('span', { text: 'CrystalBear', cls: 'jira-title' }); // eslint-disable-line obsidianmd/ui/sentence-case
		const refreshBtn = header.createEl('button', { text: t.refresh, cls: 'jira-refresh-btn' });
		refreshBtn.addEventListener('click', () => { void this.render(); });

		this.contextContainer = contentEl.createDiv({ cls: 'jira-ctx-slot' });
		this.updateContextCard();

		this.renderTabBar(contentEl);

		const body = contentEl.createDiv({ cls: 'jira-body' });
		if (this.activeTab === 'dashboard') {
			this.renderDashboard(body);
		} else {
			this.renderBrowse(body);
		}
	}

	private renderTabBar(container: HTMLElement): void {
		const tabBar = container.createDiv({ cls: 'jira-tab-bar' });
		const tabs: Array<{ id: ActiveTab; label: string }> = [
			{ id: 'dashboard', label: t.dashboardTab },
			{ id: 'browse', label: t.browseTab },
		];
		for (const tab of tabs) {
			const btn = tabBar.createEl('button', {
				text: tab.label,
				cls: `jira-tab${this.activeTab === tab.id ? ' jira-tab--active' : ''}`,
			});
			btn.addEventListener('click', () => {
				this.activeTab = tab.id;
				void this.render();
			});
		}
	}

	private renderDashboard(body: HTMLElement): void {
		const container = body.createDiv({ cls: 'jira-dash-container' });
		this.dashboardComponent = mount(DashboardPanel, {
			target: container,
			props: {
				settings: this.resolveApiSettings(),
			},
		}) as Record<string, unknown>;
	}

	private renderBrowse(body: HTMLElement): void {
		const container = body.createDiv({ cls: 'jira-browse-container' });
		this.browserComponent = mount(BrowserPanel, {
			target: container,
			props: {
				settings: this.resolveApiSettings(),
			},
		}) as Record<string, unknown>;
	}
}
