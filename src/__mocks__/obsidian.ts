import { vi } from 'vitest';

export const requestUrl = vi.fn();

export const moment = {
	locale: vi.fn(() => 'en'),
};

export class Plugin {}

export class PluginSettingTab {
	app: unknown;
	plugin: unknown;
	containerEl = { empty: vi.fn() } as unknown as HTMLElement;
	constructor(_app: unknown, _plugin: unknown) {}
}

export class ItemView {
	contentEl = document.createElement('div');
	constructor() {}
}

export class MarkdownRenderChild {
	constructor(public containerEl: HTMLElement) {}
}

export class TFile {}

export class Notice {
	constructor(public message: string) {}
}

export const Setting = class {
	setName() { return this; }
	setDesc() { return this; }
	setHeading() { return this; }
	addText(_cb: (_t: unknown) => void) { _cb({ setPlaceholder() { return this; }, setValue() { return this; }, onChange() { return this; }, inputEl: document.createElement('input') }); return this; }
	addTextArea(_cb: (_t: unknown) => void) { _cb({ setPlaceholder() { return this; }, setValue() { return this; }, onChange() { return this; } }); return this; }
	addButton(_cb: (_b: unknown) => void) { _cb({ setButtonText() { return this; }, onClick() { return this; } }); return this; }
};
