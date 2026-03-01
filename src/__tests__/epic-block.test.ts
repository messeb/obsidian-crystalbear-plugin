import { describe, test, expect } from 'vitest';
import { parseBlockSource } from '../ui/epic-block';

describe('parseBlockSource', () => {
	test('single key line → issue type', () => {
		const result = parseBlockSource('KEY-123');
		expect(result).toEqual({ type: 'issue', key: 'KEY-123' });
	});

	test('empty string → issue with empty key', () => {
		const result = parseBlockSource('');
		expect(result).toEqual({ type: 'issue', key: '' });
	});

	test('project only → project type', () => {
		const result = parseBlockSource('project: MYPROJECT');
		expect(result).toEqual({ type: 'project', project: 'MYPROJECT', reporter: undefined, assignee: undefined, labels: [] });
	});

	test('project + reporter → project type with reporter', () => {
		const result = parseBlockSource('project: MYPROJECT\nreporter: user@example.com');
		expect(result).toEqual({ type: 'project', project: 'MYPROJECT', reporter: 'user@example.com', assignee: undefined, labels: [] });
	});

	test('project + assignee → project type with assignee', () => {
		const result = parseBlockSource('project: MYPROJECT\nassignee: user@example.com');
		expect(result).toEqual({ type: 'project', project: 'MYPROJECT', reporter: undefined, assignee: 'user@example.com', labels: [] });
	});

	test('project + labels → project type with labels', () => {
		const result = parseBlockSource('project: MYPROJECT\nlabels: backend, frontend');
		expect(result).toEqual({ type: 'project', project: 'MYPROJECT', reporter: undefined, assignee: undefined, labels: ['backend', 'frontend'] });
	});

	test('project + assignee + labels → project type with all filters', () => {
		const result = parseBlockSource('project: MYPROJECT\nassignee: dev@example.com\nlabels: backend');
		expect(result).toEqual({ type: 'project', project: 'MYPROJECT', reporter: undefined, assignee: 'dev@example.com', labels: ['backend'] });
	});

	test('name + items → list type without labels', () => {
		const result = parseBlockSource('name: Sprint 42\nitems: KEY-1, KEY-2, KEY-3');
		expect(result).toEqual({
			type: 'list',
			name: 'Sprint 42',
			keys: ['KEY-1', 'KEY-2', 'KEY-3'],
			filterLabels: [],
		});
	});

	test('name + items + labels → list type with labels', () => {
		const result = parseBlockSource('name: Sprint 42\nitems: KEY-1, KEY-2\nlabels: backend, frontend');
		expect(result).toEqual({
			type: 'list',
			name: 'Sprint 42',
			keys: ['KEY-1', 'KEY-2'],
			filterLabels: ['backend', 'frontend'],
		});
	});

	test('non-KV line falls through to issue type', () => {
		const result = parseBlockSource('name: Sprint\nKEY-123');
		expect(result).toEqual({ type: 'issue', key: 'name: Sprint' });
	});

	test('extra whitespace and blank lines are trimmed', () => {
		const result = parseBlockSource('  KEY-123  \n\n  ');
		expect(result).toEqual({ type: 'issue', key: 'KEY-123' });
	});

	test('reporter before project → still resolved as project type', () => {
		const result = parseBlockSource('reporter: dev@example.com\nproject: PROJKEY');
		expect(result).toEqual({ type: 'project', project: 'PROJKEY', reporter: 'dev@example.com', assignee: undefined, labels: [] });
	});

	test('list with single item', () => {
		const result = parseBlockSource('name: Solo\nitems: KEY-1');
		expect(result).toEqual({
			type: 'list',
			name: 'Solo',
			keys: ['KEY-1'],
			filterLabels: [],
		});
	});

	test('items with extra spaces around keys', () => {
		const result = parseBlockSource('name: Test\nitems:  KEY-1 ,  KEY-2 ');
		expect(result).toEqual({
			type: 'list',
			name: 'Test',
			keys: ['KEY-1', 'KEY-2'],
			filterLabels: [],
		});
	});
});
