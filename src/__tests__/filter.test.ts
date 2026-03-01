import { describe, test, expect } from 'vitest';
import { filterByStatus, filterByLabels, computeTotalSP } from '../utils/filter';
import type { JiraIssue } from '../types';

function makeIssue(key: string, status: string, colorName = 'blue-gray', labels: string[] = [], sp?: number): JiraIssue {
	return {
		id: key,
		key,
		fields: {
			summary: `Summary of ${key}`,
			status: { name: status, statusCategory: { key: status.toLowerCase(), colorName } },
			priority: { name: 'Medium' },
			issuetype: { name: 'Story' },
			project: { key: 'PROJ', name: 'Project' },
			labels,
			customfield_10016: sp ?? null,
		},
	};
}

const issues = [
	makeIssue('KEY-1', 'To Do', 'blue-gray', ['backend']),
	makeIssue('KEY-2', 'In Progress', 'yellow', ['frontend']),
	makeIssue('KEY-3', 'Done', 'green', ['backend', 'frontend']),
];

// --- filterByStatus ---
describe('filterByStatus', () => {
	test('empty activeStatuses → all issues visible', () => {
		const result = filterByStatus(issues, {});
		expect(result).toHaveLength(3);
	});

	test('one status deactivated → that status filtered out', () => {
		const result = filterByStatus(issues, { 'To Do': false });
		expect(result.map(i => i.key)).toEqual(['KEY-2', 'KEY-3']);
	});

	test('all statuses deactivated → show all (show-all when none selected)', () => {
		const result = filterByStatus(issues, { 'To Do': false, 'In Progress': false, 'Done': false });
		expect(result).toHaveLength(3);
	});

	test('single status active → only that status visible', () => {
		const result = filterByStatus(issues, { 'To Do': true, 'In Progress': false, 'Done': false });
		expect(result.map(i => i.key)).toEqual(['KEY-1']);
	});

	test('empty issues array → returns empty', () => {
		const result = filterByStatus([], { 'To Do': true });
		expect(result).toHaveLength(0);
	});
});

// --- filterByLabels ---
describe('filterByLabels', () => {
	test('empty filterLabels → no filtering applied', () => {
		const result = filterByLabels(issues, [], {});
		expect(result).toHaveLength(3);
	});

	test('specific label active → only issues with that label', () => {
		const result = filterByLabels(issues, ['backend'], {});
		expect(result.map(i => i.key)).toEqual(['KEY-1', 'KEY-3']);
	});

	test('label deactivated → excluded from filter', () => {
		const result = filterByLabels(issues, ['backend', 'frontend'], { 'backend': false });
		// only 'frontend' active → KEY-2 and KEY-3 have frontend
		expect(result.map(i => i.key)).toEqual(['KEY-2', 'KEY-3']);
	});

	test('all configured labels deactivated → show all issues', () => {
		const result = filterByLabels(issues, ['backend', 'frontend'], { 'backend': false, 'frontend': false });
		expect(result).toHaveLength(3);
	});

	test('label not on any issue → empty result', () => {
		const result = filterByLabels(issues, ['nonexistent'], {});
		expect(result).toHaveLength(0);
	});
});

// --- computeTotalSP ---
describe('computeTotalSP', () => {
	test('sums story points from default field', () => {
		const spIssues = [
			makeIssue('KEY-1', 'To Do', 'blue-gray', [], 3),
			makeIssue('KEY-2', 'Done', 'green', [], 5),
		];
		expect(computeTotalSP(spIssues, 'customfield_10016')).toBe(8);
	});

	test('skips null/undefined SP values', () => {
		const spIssues = [
			makeIssue('KEY-1', 'To Do', 'blue-gray', [], 3),
			makeIssue('KEY-2', 'Done'),       // no SP
		];
		expect(computeTotalSP(spIssues, 'customfield_10016')).toBe(3);
	});

	test('returns 0 when no issues have SP', () => {
		expect(computeTotalSP(issues, 'customfield_10016')).toBe(0);
	});

	test('uses configurable field name', () => {
		const spIssues = [
			{ ...makeIssue('KEY-1', 'To Do'), fields: { ...makeIssue('KEY-1', 'To Do').fields, customfield_99999: 7 } },
		];
		expect(computeTotalSP(spIssues, 'customfield_99999')).toBe(7);
	});

	test('empty issues → returns 0', () => {
		expect(computeTotalSP([], 'customfield_10016')).toBe(0);
	});
});
