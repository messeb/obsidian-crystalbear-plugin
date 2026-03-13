import { requestUrl } from 'obsidian';
import type { JiraChildIssue, JiraEpic, JiraIssueDetail, JiraIssue, JiraProject, JiraProjectsResponse, JiraSearchResponse } from '../types';

// Runtime settings with resolved credentials — used by all API functions
export interface JiraApiSettings {
	jiraUrl: string;
	jiraEmail: string;
	jiraApiToken: string;
	maxResults: number;
	storyPointsField: string;
}

interface JiraErrorResponse {
	errorMessages?: string[];
	errors?: Record<string, string>;
	message?: string;
}

export class JiraError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message);
		this.name = 'JiraError';
	}
}

async function fetchFromJira<T>(settings: JiraApiSettings, url: string): Promise<T> {
	const credentials = btoa(`${settings.jiraEmail}:${settings.jiraApiToken}`);
	const response = await requestUrl({
		url,
		method: 'GET',
		headers: {
			'Authorization': `Basic ${credentials}`,
			'Accept': 'application/json',
		},
		throw: false,
	});

	if (response.status < 200 || response.status >= 300) {
		const msg = extractErrorMessage(response.status, response.text);
		console.error(`[crystalbear] Jira API ${response.status} for ${url}\n${response.text}`);
		throw new JiraError(response.status, msg);
	}

	return response.json as T;
}

export async function fetchJiraIssues(settings: JiraApiSettings): Promise<JiraIssue[]> {
	const params = new URLSearchParams({
		jql: 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC',
		maxResults: String(settings.maxResults),
		fields: 'summary,status,priority,issuetype,project',
	});
	const url = `${settings.jiraUrl}/rest/api/3/search/jql?${params.toString()}`;
	const data = await fetchFromJira<JiraSearchResponse>(settings, url);
	return data.issues;
}

export async function fetchJiraProjects(settings: JiraApiSettings): Promise<JiraProject[]> {
	const PAGE_SIZE = 50;
	const all: JiraProject[] = [];
	let startAt = 0;

	// Page through all results; isLast signals the final page
	while (all.length < 500) {
		const params = new URLSearchParams({
			maxResults: String(PAGE_SIZE),
			startAt: String(startAt),
		});
		const url = `${settings.jiraUrl}/rest/api/3/project/search?${params.toString()}`;
		const data = await fetchFromJira<JiraProjectsResponse>(settings, url);
		all.push(...data.values);
		if (data.isLast) break;
		startAt += PAGE_SIZE;
	}

	return all;
}

export async function fetchJiraIssue(
	settings: JiraApiSettings,
	issueKey: string,
	storyPointsField = 'customfield_10016',
): Promise<JiraIssueDetail> {
	const params = new URLSearchParams({ fields: `summary,status,issuetype,fixVersions,description,parent,${storyPointsField}` });
	const url = `${settings.jiraUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?${params.toString()}`;
	return fetchFromJira<JiraIssueDetail>(settings, url);
}

export async function fetchIssuesByKeys(
	settings: JiraApiSettings,
	keys: string[],
): Promise<JiraIssue[]> {
	if (keys.length === 0) return [];

	const spField = settings.storyPointsField;
	const params = new URLSearchParams({
		jql: `key in (${keys.join(', ')})`,
		fields: `summary,status,issuetype,project,${spField},labels`,
		maxResults: String(keys.length),
	});
	const url = `${settings.jiraUrl}/rest/api/3/search/jql?${params.toString()}`;
	const data = await fetchFromJira<JiraSearchResponse>(settings, url);
	return data.issues;
}

export async function searchIssues(
	settings: JiraApiSettings,
	query: string,
): Promise<JiraIssue[]> {
	const escaped = query.replace(/"/g, '\\"');
	const params = new URLSearchParams({
		jql: `text ~ "${escaped}" ORDER BY updated DESC`,
		fields: 'summary,status,issuetype,project,parent',
		maxResults: '50',
	});
	const url = `${settings.jiraUrl}/rest/api/3/search/jql?${params.toString()}`;
	const data = await fetchFromJira<JiraSearchResponse>(settings, url);
	return data.issues;
}

export async function fetchIssuesByProject(
	settings: JiraApiSettings,
	project: string,
	options: { reporter?: string; assignee?: string; labels?: string[] } = {},
): Promise<{ issues: JiraIssue[]; total: number }> {
	const conditions = [`project = "${project}"`];
	if (options.reporter) conditions.push(`reporter = "${options.reporter}"`);
	if (options.assignee) conditions.push(`assignee = "${options.assignee}"`);
	if (options.labels?.length) {
		conditions.push(`labels in (${options.labels.map(l => `"${l}"`).join(', ')})`);
	}
	const jql = conditions.join(' AND ') + ' ORDER BY created ASC';
	const params = new URLSearchParams({
		jql,
		fields: 'summary,status,priority,issuetype,project,labels',
		maxResults: '100',
	});
	const url = `${settings.jiraUrl}/rest/api/3/search/jql?${params.toString()}`;
	const data = await fetchFromJira<JiraSearchResponse>(settings, url);
	return { issues: data.issues, total: data.total };
}

export async function fetchEpicsByProject(
	settings: JiraApiSettings,
	projectKey: string,
): Promise<JiraEpic[]> {
	const params = new URLSearchParams({
		jql: `project = "${projectKey}" AND issuetype = Epic ORDER BY created ASC`,
		fields: 'summary,status',
		maxResults: '100',
	});
	const url = `${settings.jiraUrl}/rest/api/3/search/jql?${params.toString()}`;
	const data = await fetchFromJira<{ issues: JiraEpic[]; total: number }>(settings, url);
	return data.issues;
}

export async function fetchEpicChildren(
	settings: JiraApiSettings,
	epicKey: string,
	storyPointsField = 'customfield_10016',
): Promise<{ issues: JiraChildIssue[]; total: number }> {
	const params = new URLSearchParams({
		jql: `parent = ${epicKey} ORDER BY created ASC`,
		fields: `summary,status,fixVersions,${storyPointsField}`,
		maxResults: '100',
	});
	const url = `${settings.jiraUrl}/rest/api/3/search/jql?${params.toString()}`;
	const data = await fetchFromJira<{ issues: JiraChildIssue[]; total: number }>(settings, url);
	return { issues: data.issues, total: data.total };
}

export async function testConnection(settings: JiraApiSettings): Promise<void> {
	const url = `${settings.jiraUrl}/rest/api/3/myself`;
	await fetchFromJira<unknown>(settings, url);
}

function extractErrorMessage(status: number, body: string): string {
	let detail = '';
	try {
		const parsed = JSON.parse(body) as JiraErrorResponse;
		const messages = [
			...(parsed.errorMessages ?? []),
			...Object.values(parsed.errors ?? {}),
			...(parsed.message ? [parsed.message] : []),
		];
		if (messages.length > 0) detail = messages.join('; ');
	} catch {
		if (body) detail = body.slice(0, 300);
	}
	return detail
		? `Jira API error ${status}: ${detail}`
		: `Jira API error ${status}`;
}
