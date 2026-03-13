import { Plugin, addIcon } from 'obsidian';

// Obsidian renders addIcon content in a viewBox="0 0 100 100" SVG container
const CRYSTALBEAR_ICON = `<circle cx="22" cy="22" r="16" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="22" r="16" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="38" cy="54" r="5" fill="currentColor"/><circle cx="62" cy="54" r="5" fill="currentColor"/><ellipse cx="50" cy="72" rx="13" ry="9" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="64" r="5" fill="currentColor"/>`;
import { DEFAULT_SETTINGS, type JiraPluginSettings, JiraSettingTab } from './settings';
import { JIRA_VIEW_TYPE, JiraIssuesView } from './ui/jira-view';
import { registerJiraCodeBlock } from './ui/epic-block';

export default class JiraPlugin extends Plugin {
	settings: JiraPluginSettings;

	async onload() {
		await this.loadSettings();

		addIcon('crystalbear', CRYSTALBEAR_ICON);
		this.registerView(JIRA_VIEW_TYPE, (leaf) => new JiraIssuesView(leaf, this));

		this.addRibbonIcon('crystalbear', 'CrystalBear', () => this.activateView()); // eslint-disable-line obsidianmd/ui/sentence-case

		this.addCommand({
			id: 'open-jira-issues',
			name: 'Open panel',
			callback: () => this.activateView(),
		});

		this.addSettingTab(new JiraSettingTab(this.app, this));
		registerJiraCodeBlock(this);
	}

	onunload() {}

	async activateView() {
		this.app.workspace.detachLeavesOfType(JIRA_VIEW_TYPE);
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: JIRA_VIEW_TYPE, active: true });
		await this.app.workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<JiraPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
