import { type App, Notice, PluginSettingTab, SecretComponent, Setting } from 'obsidian';
import type JiraPlugin from './main';
import { testConnection, type JiraApiSettings } from './api/jira-client';
import { t } from './i18n';

export interface JiraPluginSettings {
	jiraUrl: string;
	jiraEmailSecret: string;
	jiraApiTokenSecret: string;
	maxResults: number;
	storyPointsField: string;
}

export const DEFAULT_SETTINGS: JiraPluginSettings = {
	jiraUrl: '',
	jiraEmailSecret: 'atlassian-email',
	jiraApiTokenSecret: 'atlassian-api-token',
	maxResults: 50,
	storyPointsField: 'customfield_10016',
};

export class JiraSettingTab extends PluginSettingTab {
	plugin: JiraPlugin;

	constructor(app: App, plugin: JiraPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// --- Account ---
		new Setting(containerEl)
			.setName(t.settingsSectionAccount)
			.setHeading();

		new Setting(containerEl)
			.setName(t.settingJiraUrlName)
			.setDesc(t.settingJiraUrlDesc)
			.addText(text => text
				.setPlaceholder(t.settingJiraUrlPlaceholder)
				.setValue(this.plugin.settings.jiraUrl)
				.onChange(async (value) => {
					this.plugin.settings.jiraUrl = value.replace(/\/$/, '');
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.settingEmailName)
			.setDesc(t.settingEmailDesc)
			.addComponent(el => new SecretComponent(this.app, el)
				.setValue(this.plugin.settings.jiraEmailSecret)
				.onChange(async (value) => {
					this.plugin.settings.jiraEmailSecret = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.settingApiTokenName)
			.setDesc(t.settingApiTokenDesc)
			.addComponent(el => new SecretComponent(this.app, el)
				.setValue(this.plugin.settings.jiraApiTokenSecret)
				.onChange(async (value) => {
					this.plugin.settings.jiraApiTokenSecret = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.settingTestConnectionName)
			.setDesc(t.settingTestConnectionDesc)
			.addButton(btn => btn
				.setButtonText(t.testConnectionBtn)
				.onClick(async () => {
					const apiSettings: JiraApiSettings = {
						jiraUrl: this.plugin.settings.jiraUrl,
						jiraEmail: this.app.secretStorage.getSecret(this.plugin.settings.jiraEmailSecret) ?? '',
						jiraApiToken: this.app.secretStorage.getSecret(this.plugin.settings.jiraApiTokenSecret) ?? '',
						maxResults: this.plugin.settings.maxResults,
						storyPointsField: this.plugin.settings.storyPointsField,
					};
					try {
						await testConnection(apiSettings);
						new Notice(t.connectionSuccess);
					} catch (err) {
						new Notice(t.connectionFailed(err instanceof Error ? err.message : String(err)));
					}
				}));

		// --- Behaviour ---
		new Setting(containerEl)
			.setName(t.settingsSectionBehaviour)
			.setHeading();

		new Setting(containerEl)
			.setName(t.settingMaxResultsName)
			.setDesc(t.settingMaxResultsDesc)
			.addText(text => text
				.setPlaceholder('50')
				.setValue(String(this.plugin.settings.maxResults))
				.onChange(async (value) => {
					const num = parseInt(value, 10);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.maxResults = num;
						await this.plugin.saveSettings();
					}
				}));

		// --- Advanced ---
		new Setting(containerEl)
			.setName(t.settingsSectionAdvanced)
			.setHeading();

		new Setting(containerEl)
			.setName(t.settingStoryPointsName)
			.setDesc(t.settingStoryPointsDesc)
			.addText(text => text
				.setPlaceholder(t.settingStoryPointsPlaceholder)
				.setValue(this.plugin.settings.storyPointsField)
				.onChange(async (value) => {
					this.plugin.settings.storyPointsField = value.trim() || 'customfield_10016';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.settingOpenPanelName)
			.setDesc(t.settingOpenPanelDesc)
			.addButton(btn => btn
				.setButtonText(t.openPanelBtn)
				.onClick(() => this.plugin.activateView()));
	}
}
