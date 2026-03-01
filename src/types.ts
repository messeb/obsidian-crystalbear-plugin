export interface JiraIssue {
	id: string;
	key: string;
	fields: {
		summary: string;
		status: { name: string; statusCategory: { key: string; colorName: string } };
		priority: { name: string };
		issuetype: { name: string };
		project: { key: string; name: string };
		parent?: { key: string; fields: { summary: string } };
		customfield_10016?: number | null; // Story Points (default field)
		labels?: string[];
		[key: string]: unknown; // allow dynamic SP field access
	};
}

export interface JiraSearchResponse {
	total: number;
	issues: JiraIssue[];
}

export interface JiraProject {
	id: string;
	key: string;
	name: string;
	projectTypeKey: string;
}

export interface JiraProjectsResponse {
	values: JiraProject[];
	total: number;
	isLast: boolean;
}

export interface JiraIssueDetail {
	id: string;
	key: string;
	fields: {
		summary: string;
		status: { name: string; statusCategory: { key: string; colorName: string } };
		issuetype: { name: string };
		fixVersions: { id: string; name: string }[];
		parent?: { key: string; fields: { summary: string } };
		description?: unknown; // Atlassian Document Format (ADF)
		[key: string]: unknown; // dynamic SP field access
	};
}

export interface JiraChildIssue {
	id: string;
	key: string;
	fields: {
		summary: string;
		status: { name: string; statusCategory: { key: string; colorName: string } };
		fixVersions: { id: string; name: string }[];
		[key: string]: unknown; // dynamic SP field access
	};
}

export interface JiraEpic {
	id: string;
	key: string;
	fields: {
		summary: string;
		status: { name: string; statusCategory: { key: string; colorName: string } };
	};
}
