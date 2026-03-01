import { moment } from 'obsidian';

export interface Translations {
	// Loading / hints
	loading: string;
	hintProvideKey: string;
	hintProvideQuery: string;
	// jira-view
	refresh: string;
	retry: string;
	loadingIssues: string;
	loadingProjects: string;
	noIssuesFound: string;
	noProjectsFound: string;
	issuesTab: string;
	projectsTab: string;
	// JiraBlock
	openCount: (n: number) => string;
	totalCount: (n: number) => string;
	allVersions: string;
	fixVersions: string;
	// ItemListBlock
	items: (n: number) => string;
	stateLabel: string;
	labelsLabel: string;
	totalStoryPoints: string;
	// CreatorBlock
	reportedBy: string;
	assignedTo: string;
	allTypes: string;
	typeLabel: string;
	epicLabel: string;
	storyPoints: string;
	fixVersion: string;
	// Settings sections
	settingsSectionAccount: string;
	settingsSectionBehaviour: string;
	settingsSectionAdvanced: string;
	// Settings fields
	settingJiraUrlName: string;
	settingJiraUrlDesc: string;
	settingJiraUrlPlaceholder: string;
	settingEmailName: string;
	settingEmailDesc: string;
	settingApiTokenName: string;
	settingApiTokenDesc: string;
	settingTestConnectionName: string;
	settingTestConnectionDesc: string;
	testConnectionBtn: string;
	connectionSuccess: string;
	connectionFailed: (msg: string) => string;
	settingMaxResultsName: string;
	settingMaxResultsDesc: string;
	settingStoryPointsName: string;
	settingStoryPointsDesc: string;
	settingStoryPointsPlaceholder: string;
	settingOpenPanelName: string;
	settingOpenPanelDesc: string;
	openPanelBtn: string;
	// Tooltips
	copyKey: string;
	pin: string;
	unpin: string;
	// Browse panel
	browseTab: string;
	back: string;
	searchPlaceholder: string;
	noEpicsFound: string;
	insertList: string;
	listNamePlaceholder: string;
	nSelected: (n: number) => string;
	noEditorOpen: string;
	pinnedSection: string;
	noEpic: string;
	searchHint: string;
	searchButton: string;
	searchResults: string;
	// Dashboard panel
	dashboardTab: string;
	toDo: string;
	inProgress: string;
	totalIssues: string;
	projectsSection: string;
	noneVersion: string;
	selectionEmpty: string;
	activeNote: string;
	dismissContext: string;
	contextNotFound: (key: string) => string;
}

const en: Translations = {
	loading: 'Loading…',
	hintProvideKey: 'Provide a Jira issue key in the code block',
	hintProvideQuery: 'Provide a Jira issue key or query in the code block',
	refresh: 'Refresh',
	retry: 'Retry',
	loadingIssues: 'Loading issues…',
	loadingProjects: 'Loading projects…',
	noIssuesFound: 'No issues found.',
	noProjectsFound: 'No projects found.',
	issuesTab: 'Issues',
	projectsTab: 'Projects',
	openCount: (n) => `${n} open`,
	totalCount: (n) => `${n} total`,
	allVersions: 'All versions',
	fixVersions: 'Fix versions:',
	items: (n) => `${n} items`,
	stateLabel: 'State:',
	labelsLabel: 'Labels:',
	totalStoryPoints: 'Total Story Points',
	reportedBy: 'reported by',
	assignedTo: 'assigned to',
	allTypes: 'All types',
	typeLabel: 'Type:',
	epicLabel: 'Epic:',
	storyPoints: 'Story Points:',
	fixVersion: 'Fix Version:',
	settingsSectionAccount: 'Account',
	settingsSectionBehaviour: 'Behaviour',
	settingsSectionAdvanced: 'Advanced',
	settingJiraUrlName: 'Jira URL',
	settingJiraUrlDesc: 'Your Atlassian instance URL, e.g. https://yourcompany.atlassian.net',
	settingJiraUrlPlaceholder: 'https://yourcompany.atlassian.net',
	settingEmailName: 'Email',
	settingEmailDesc: 'Your Atlassian account email address',
	settingApiTokenName: 'API token',
	settingApiTokenDesc: 'Create a token at https://id.atlassian.com/manage-profile/security/api-tokens',
	settingTestConnectionName: 'Test connection',
	settingTestConnectionDesc: 'Verify your Jira credentials and URL',
	testConnectionBtn: 'Test connection',
	connectionSuccess: 'Connection successful!',
	connectionFailed: (msg) => `Connection failed: ${msg}`,
	settingMaxResultsName: 'Max results',
	settingMaxResultsDesc: 'Maximum number of issues to fetch (1–100)',
	settingStoryPointsName: 'Story points field',
	settingStoryPointsDesc: 'Jira custom field ID for story points (default: customfield_10016)',
	settingStoryPointsPlaceholder: 'Enter field ID',
	settingOpenPanelName: 'Open panel',
	settingOpenPanelDesc: 'Opens the side panel',
	openPanelBtn: 'Open panel',
	copyKey: 'Copy key',
	pin: 'Pin',
	unpin: 'Unpin',
	browseTab: 'Browse',
	back: 'Back',
	searchPlaceholder: 'Search…',
	noEpicsFound: 'No epics found.',
	insertList: 'Insert list',
	listNamePlaceholder: 'List name…',
	nSelected: (n) => `${n} selected`,
	noEditorOpen: 'No active editor.',
	pinnedSection: 'Pinned',
	noEpic: 'No Epic',
	searchHint: 'Type at least 2 characters to search…',
	searchButton: 'Search',
	searchResults: 'Search Results',
	noneVersion: 'None',
	dashboardTab: 'Dashboard',
	toDo: 'To Do',
	inProgress: 'In Progress',
	totalIssues: 'Total',
	projectsSection: 'Projects',
	selectionEmpty: 'No issues selected',
	activeNote: 'Active note',
	dismissContext: 'Dismiss',
	contextNotFound: (key) => `Issue '${key}' not found`,
};

const de: Translations = {
	loading: 'Lädt…',
	hintProvideKey: 'Jira-Issue-Schlüssel im Code-Block angeben',
	hintProvideQuery: 'Jira-Issue-Schlüssel oder Abfrage im Code-Block angeben',
	refresh: 'Aktualisieren',
	retry: 'Erneut versuchen',
	loadingIssues: 'Issues werden geladen…',
	loadingProjects: 'Projekte werden geladen…',
	noIssuesFound: 'Keine Issues gefunden.',
	noProjectsFound: 'Keine Projekte gefunden.',
	issuesTab: 'Issues',
	projectsTab: 'Projekte',
	openCount: (n) => `${n} offen`,
	totalCount: (n) => `${n} gesamt`,
	allVersions: 'Alle Versionen',
	fixVersions: 'Fix-Versionen:',
	items: (n) => `${n} Einträge`,
	stateLabel: 'Status:',
	labelsLabel: 'Labels:',
	totalStoryPoints: 'Story-Points gesamt',
	reportedBy: 'gemeldet von',
	assignedTo: 'zugewiesen an',
	allTypes: 'Alle Typen',
	typeLabel: 'Typ:',
	epicLabel: 'Epic:',
	storyPoints: 'Story-Points:',
	fixVersion: 'Fix-Version:',
	settingsSectionAccount: 'Nutzerkonto',
	settingsSectionBehaviour: 'Verhalten',
	settingsSectionAdvanced: 'Erweitert',
	settingJiraUrlName: 'Jira-URL',
	settingJiraUrlDesc: 'URL deiner Atlassian-Instanz, z. B. https://firmenname.atlassian.net',
	settingJiraUrlPlaceholder: 'https://firmenname.atlassian.net',
	settingEmailName: 'E-Mail',
	settingEmailDesc: 'Deine Atlassian-Konto-E-Mail-Adresse',
	settingApiTokenName: 'API-Token',
	settingApiTokenDesc: 'Token erstellen unter https://id.atlassian.com/manage-profile/security/api-tokens',
	settingTestConnectionName: 'Verbindung testen',
	settingTestConnectionDesc: 'Jira-Zugangsdaten und URL prüfen',
	testConnectionBtn: 'Verbindung testen',
	connectionSuccess: 'Verbindung erfolgreich!',
	connectionFailed: (msg) => `Verbindung fehlgeschlagen: ${msg}`,
	settingMaxResultsName: 'Max. Ergebnisse',
	settingMaxResultsDesc: 'Maximale Anzahl abzurufender Issues (1–100)',
	settingStoryPointsName: 'Story-Points-Feld',
	settingStoryPointsDesc: 'Jira-Benutzerfeldkennung für Story-Points (Standard: customfield_10016)',
	settingStoryPointsPlaceholder: 'Feld-ID eingeben',
	settingOpenPanelName: 'Panel öffnen',
	settingOpenPanelDesc: 'Öffnet das Seitenpanel',
	openPanelBtn: 'Panel öffnen',
	copyKey: 'Schlüssel kopieren',
	pin: 'Anheften',
	unpin: 'Loslösen',
	browseTab: 'Durchsuchen',
	back: 'Zurück',
	searchPlaceholder: 'Suchen…',
	noEpicsFound: 'Keine Epics gefunden.',
	insertList: 'Liste einfügen',
	listNamePlaceholder: 'Listenname…',
	nSelected: (n) => `${n} ausgewählt`,
	noEditorOpen: 'Kein aktiver Editor.',
	pinnedSection: 'Angeheftet',
	noEpic: 'Kein Epic',
	searchHint: 'Mindestens 2 Zeichen eingeben…',
	searchButton: 'Suchen',
	searchResults: 'Suchergebnisse',
	noneVersion: 'Keine',
	dashboardTab: 'Dashboard',
	toDo: 'Offen',
	inProgress: 'In Bearbeitung',
	totalIssues: 'Gesamt',
	projectsSection: 'Projekte',
	selectionEmpty: 'Keine Issues ausgewählt',
	activeNote: 'Aktive Notiz',
	dismissContext: 'Schließen',
	contextNotFound: (key) => `Issue '${key}' nicht gefunden`,
};

const TRANSLATIONS: Record<string, Translations> = { en, de };

export const t: Translations = (() => {
	const lang = (moment.locale().split('-')[0] ?? 'en').toLowerCase();
	return TRANSLATIONS[lang] ?? TRANSLATIONS['en'] ?? en;
})();
