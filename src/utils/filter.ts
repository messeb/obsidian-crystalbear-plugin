import type { JiraIssue } from '../types';

/**
 * Filters issues by active statuses.
 * - If all statuses are deactivated (none set to true), returns all issues.
 * - A missing key in activeStatuses means the status is active (true).
 */
export function filterByStatus(
	issues: JiraIssue[],
	activeStatuses: Record<string, boolean>,
): JiraIssue[] {
	const allStatuses = [...new Set(issues.map(i => i.fields.status.name))];
	const anyStatusActive = allStatuses.some(s => activeStatuses[s] ?? true);
	if (!anyStatusActive) return issues;
	return issues.filter(i => activeStatuses[i.fields.status.name] ?? true);
}

/**
 * Filters issues by active labels.
 * - If filterLabels is empty, returns all issues (no label filter configured).
 * - If all configured labels are deactivated, returns all issues.
 * - A missing key in activeLabels means the label is active (true).
 */
export function filterByLabels(
	issues: JiraIssue[],
	filterLabels: string[],
	activeLabels: Record<string, boolean>,
): JiraIssue[] {
	if (filterLabels.length === 0) return issues;
	const active = filterLabels.filter(l => activeLabels[l] ?? true);
	if (active.length === 0) return issues;
	return issues.filter(i => i.fields.labels?.some(l => active.includes(l)) ?? false);
}

/**
 * Computes the sum of story points across issues using a configurable field name.
 */
export function computeTotalSP(issues: JiraIssue[], spField: string): number {
	return issues.reduce((sum, i) => {
		const val = (i.fields as Record<string, unknown>)[spField];
		return sum + ((val as number | null | undefined) ?? 0);
	}, 0);
}
