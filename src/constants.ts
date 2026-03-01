export const STATUS_COLORS: Record<string, string> = {
	'blue-gray': '#42526e',
	'yellow': '#ff8b00',
	'green': '#00875a',
	'red': '#de350b',
	'medium-gray': '#6b778c',
};

export function statusColor(colorName: string): string {
	return STATUS_COLORS[colorName] ?? '#42526e';
}
