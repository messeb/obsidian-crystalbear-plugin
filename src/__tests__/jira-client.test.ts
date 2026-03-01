import { describe, test, expect, vi, beforeEach } from 'vitest';
import { requestUrl } from 'obsidian';
import type { JiraApiSettings } from '../api/jira-client';
import {
	fetchJiraIssues,
	fetchJiraProjects,
	fetchJiraIssue,
	fetchIssuesByKeys,
	fetchIssuesByProject,
	fetchEpicChildren,
	testConnection,
} from '../api/jira-client';
const defaultSettings: JiraApiSettings = {
	jiraUrl: 'https://test.atlassian.net',
	jiraEmail: 'user@example.com',
	jiraApiToken: 'token123',
	maxResults: 50,
	storyPointsField: 'customfield_10016',
};

const mockRequestUrl = vi.mocked(requestUrl);

// Cast helper — our mock only needs status/json/text, full RequestUrlResponse type not required
function ok(json: unknown) {
	return { status: 200, json, text: '', headers: {}, arrayBuffer: new ArrayBuffer(0) } as Awaited<ReturnType<typeof requestUrl>>;
}

function err(status: number, text = '') {
	return { status, json: {}, text, headers: {}, arrayBuffer: new ArrayBuffer(0) } as Awaited<ReturnType<typeof requestUrl>>;
}

function firstCallUrl(): string {
	const call = mockRequestUrl.mock.calls[0]?.[0];
	if (typeof call === 'object' && call !== null && 'url' in call) {
		return call.url;
	}
	throw new Error('No URL found in first call');
}

function firstCallHeaders(): Record<string, string> {
	const call = mockRequestUrl.mock.calls[0]?.[0];
	if (typeof call === 'object' && call !== null && 'headers' in call) {
		return call.headers as Record<string, string>;
	}
	throw new Error('No headers found in first call');
}

beforeEach(() => {
	vi.clearAllMocks();
});

// --- fetchJiraIssues ---
describe('fetchJiraIssues', () => {
	test('returns issues on success', async () => {
		const issues = [{ id: '1', key: 'KEY-1', fields: { summary: 'Test', status: { name: 'Open', statusCategory: { key: 'new', colorName: 'blue-gray' } }, priority: { name: 'Medium' }, issuetype: { name: 'Story' }, project: { key: 'KEY', name: 'Key Project' } } }];
		mockRequestUrl.mockResolvedValue(ok({ issues, total: 1 }));

		const result = await fetchJiraIssues(defaultSettings);

		expect(result).toEqual(issues);
		expect(mockRequestUrl).toHaveBeenCalledOnce();
	});

	test('sends correct Basic auth header', async () => {
		mockRequestUrl.mockResolvedValue(ok({ issues: [], total: 0 }));

		await fetchJiraIssues(defaultSettings);

		const expected = `Basic ${btoa('user@example.com:token123')}`;
		expect(firstCallHeaders()['Authorization']).toBe(expected);
	});

	test('throws on HTTP 401', async () => {
		mockRequestUrl.mockResolvedValue(err(401, JSON.stringify({ message: 'Unauthorized' })));

		await expect(fetchJiraIssues(defaultSettings)).rejects.toThrow('Jira API error 401: Unauthorized');
	});

	test('throws on HTTP 403', async () => {
		mockRequestUrl.mockResolvedValue(err(403));

		await expect(fetchJiraIssues(defaultSettings)).rejects.toThrow('Jira API error 403');
	});

	test('throws on HTTP 500 with errorMessages', async () => {
		mockRequestUrl.mockResolvedValue(err(500, JSON.stringify({ errorMessages: ['Internal error'] })));

		await expect(fetchJiraIssues(defaultSettings)).rejects.toThrow('Jira API error 500: Internal error');
	});

	test('falls back to raw body slice on JSON parse error', async () => {
		mockRequestUrl.mockResolvedValue(err(502, 'Bad Gateway response here'));

		await expect(fetchJiraIssues(defaultSettings)).rejects.toThrow('Bad Gateway response here');
	});
});

// --- fetchJiraProjects ---
describe('fetchJiraProjects', () => {
	test('returns all projects on single page', async () => {
		const projects = [{ id: '1', key: 'A', name: 'Alpha', projectTypeKey: 'software' }];
		mockRequestUrl.mockResolvedValue(ok({ values: projects, isLast: true, total: 1 }));

		const result = await fetchJiraProjects(defaultSettings);

		expect(result).toHaveLength(1);
		expect(result[0]?.key).toBe('A');
	});

	test('paginates across multiple pages', async () => {
		mockRequestUrl
			.mockResolvedValueOnce(ok({ values: [{ id: '1', key: 'A', name: 'Alpha', projectTypeKey: 'software' }], isLast: false, total: 2 }))
			.mockResolvedValueOnce(ok({ values: [{ id: '2', key: 'B', name: 'Beta', projectTypeKey: 'software' }], isLast: true, total: 2 }));

		const result = await fetchJiraProjects(defaultSettings);

		expect(result).toHaveLength(2);
		expect(mockRequestUrl).toHaveBeenCalledTimes(2);
	});

	test('throws on HTTP error during pagination', async () => {
		mockRequestUrl.mockResolvedValue(err(404));

		await expect(fetchJiraProjects(defaultSettings)).rejects.toThrow('Jira API error 404');
	});
});

// --- fetchJiraIssue ---
describe('fetchJiraIssue', () => {
	test('returns issue detail on success', async () => {
		const issue = { id: '1', key: 'KEY-1', fields: { summary: 'Epic thing', status: { name: 'Done', statusCategory: { key: 'done', colorName: 'green' } }, issuetype: { name: 'Epic' }, fixVersions: [] } };
		mockRequestUrl.mockResolvedValue(ok(issue));

		const result = await fetchJiraIssue(defaultSettings, 'KEY-1');

		expect(result.key).toBe('KEY-1');
		expect(result.fields.issuetype.name).toBe('Epic');
	});

	test('URL encodes the issue key', async () => {
		mockRequestUrl.mockResolvedValue(ok({ id: '1', key: 'KEY-1', fields: { summary: '', status: { name: 'Open', statusCategory: { key: 'new', colorName: 'blue-gray' } }, issuetype: { name: 'Story' }, fixVersions: [] } }));

		await fetchJiraIssue(defaultSettings, 'KEY 1');

		expect(firstCallUrl()).toContain('KEY%201');
	});

	test('throws on HTTP 404', async () => {
		mockRequestUrl.mockResolvedValue(err(404, JSON.stringify({ errorMessages: ['Issue not found'] })));

		await expect(fetchJiraIssue(defaultSettings, 'MISSING-1')).rejects.toThrow('Issue not found');
	});
});

// --- fetchIssuesByKeys ---
describe('fetchIssuesByKeys', () => {
	test('returns empty array without API call for empty keys', async () => {
		const result = await fetchIssuesByKeys(defaultSettings, []);

		expect(result).toEqual([]);
		expect(mockRequestUrl).not.toHaveBeenCalled();
	});

	test('returns issues for given keys', async () => {
		const issues = [{ id: '1', key: 'KEY-1', fields: { summary: 'Test', status: { name: 'Open', statusCategory: { key: 'new', colorName: 'blue-gray' } }, priority: { name: 'Medium' }, issuetype: { name: 'Story' }, project: { key: 'KEY', name: 'Key Project' } } }];
		mockRequestUrl.mockResolvedValue(ok({ issues, total: 1 }));

		const result = await fetchIssuesByKeys(defaultSettings, ['KEY-1']);

		expect(result).toHaveLength(1);
	});

	test('uses settings.storyPointsField in fields parameter', async () => {
		mockRequestUrl.mockResolvedValue(ok({ issues: [], total: 0 }));
		const settings = { ...defaultSettings, storyPointsField: 'customfield_99999' };

		await fetchIssuesByKeys(settings, ['KEY-1']);

		expect(firstCallUrl()).toContain('customfield_99999');
	});
});

// --- fetchIssuesByProject ---
describe('fetchIssuesByProject', () => {
	test('returns issues and total', async () => {
		const issues = [{ id: '1', key: 'KEY-1', fields: { summary: 'Created issue', status: { name: 'Open', statusCategory: { key: 'new', colorName: 'blue-gray' } }, priority: { name: 'Medium' }, issuetype: { name: 'Story' }, project: { key: 'KEY', name: 'Key Project' } } }];
		mockRequestUrl.mockResolvedValue(ok({ issues, total: 1 }));

		const result = await fetchIssuesByProject(defaultSettings, 'MYPROJ', { reporter: 'user@example.com' });

		expect(result.issues).toHaveLength(1);
		expect(result.total).toBe(1);
	});

	test('throws on HTTP error', async () => {
		mockRequestUrl.mockResolvedValue(err(403, JSON.stringify({ message: 'Forbidden' })));

		await expect(fetchIssuesByProject(defaultSettings, 'PROJ', { assignee: 'user@example.com' })).rejects.toThrow('Forbidden');
	});
});

// --- fetchEpicChildren ---
describe('fetchEpicChildren', () => {
	test('returns child issues and total', async () => {
		const issues = [{ id: '2', key: 'KEY-2', fields: { summary: 'Child story', status: { name: 'In Progress', statusCategory: { key: 'indeterminate', colorName: 'yellow' } }, fixVersions: [] } }];
		mockRequestUrl.mockResolvedValue(ok({ issues, total: 1 }));

		const result = await fetchEpicChildren(defaultSettings, 'KEY-1');

		expect(result.issues).toHaveLength(1);
		expect(result.total).toBe(1);
	});
});

// --- testConnection ---
describe('testConnection', () => {
	test('resolves successfully when API returns 200', async () => {
		mockRequestUrl.mockResolvedValue(ok({ accountId: 'abc123' }));

		await expect(testConnection(defaultSettings)).resolves.toBeUndefined();

		expect(firstCallUrl()).toContain('/rest/api/3/myself');
	});

	test('throws on HTTP error', async () => {
		mockRequestUrl.mockResolvedValue(err(401, JSON.stringify({ message: 'Unauthorized' })));

		await expect(testConnection(defaultSettings)).rejects.toThrow('Unauthorized');
	});
});
