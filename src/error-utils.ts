import { JiraError } from './api/jira-client';
import type { JiraApiSettings } from './api/jira-client';
import { t } from './i18n';

export interface ClassifiedError {
	title: string;
	description: string;
}

export function isMisconfigured(settings: JiraApiSettings): boolean {
	return !settings.jiraUrl || !settings.jiraEmail || !settings.jiraApiToken;
}

export function classifyError(err: unknown, issueKey?: string): ClassifiedError {
	if (err instanceof JiraError) {
		if (err.status === 401 || err.status === 403) {
			return { title: t.errAuth, description: t.errAuthDesc };
		}
		if (err.status === 404) {
			return {
				title: t.errNotFound,
				description: issueKey ? t.errNotFoundDesc(issueKey) : t.errNotFoundDesc('resource'),
			};
		}
		return { title: t.errUnexpected, description: t.errApi(err.message) };
	}
	const msg = err instanceof Error ? err.message : String(err);
	return { title: t.errUnexpected, description: msg };
}
