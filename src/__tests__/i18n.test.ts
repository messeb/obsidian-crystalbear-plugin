import { describe, test, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
	vi.resetModules();
});

async function loadWithLocale(locale: string) {
	// Re-import the mock to get the fresh instance created after resetModules,
	// then configure it BEFORE i18n is imported and evaluates moment.locale()
	const obsMod = await import('obsidian') as unknown as { moment: { locale: ReturnType<typeof vi.fn> } };
	vi.mocked(obsMod.moment.locale).mockReturnValue(locale);
	const { t } = await import('../i18n');
	return t;
}

describe('i18n', () => {
	test('en locale → English translations', async () => {
		const t = await loadWithLocale('en');

		expect(t.loading).toBe('Loading…');
		expect(t.noIssuesFound).toBe('No issues found.');
	});

	test('de locale → German translations', async () => {
		const t = await loadWithLocale('de');

		expect(t.loading).toBe('Lädt…');
		expect(t.noIssuesFound).toBe('Keine Issues gefunden.');
	});

	test('de-AT locale uses de prefix match', async () => {
		const t = await loadWithLocale('de-AT');

		expect(t.loading).toBe('Lädt…');
	});

	test('unknown locale fr falls back to en', async () => {
		const t = await loadWithLocale('fr');

		expect(t.loading).toBe('Loading…');
	});

	test('openCount function returns correct string', async () => {
		const t = await loadWithLocale('en');

		expect(t.openCount(3)).toBe('3 open');
		expect(t.openCount(0)).toBe('0 open');
	});

	test('items function returns correct string', async () => {
		const t = await loadWithLocale('en');

		expect(t.items(0)).toBe('0 items');
		expect(t.items(5)).toBe('5 items');
	});

	test('totalCount function in German', async () => {
		const t = await loadWithLocale('de');

		expect(t.totalCount(10)).toBe('10 gesamt');
	});
});
