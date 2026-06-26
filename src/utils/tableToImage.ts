import {
	findTableAtLine,
	tableBlockToCellMatrix,
} from './markdownTable';

const CELL_H_PAD = 12;
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 36;
const FONT_SIZE = 14;
const BORDER = 1;

function readThemeColors(): {
	bg: string;
	headerBg: string;
	text: string;
	border: string;
} {
	const root = getComputedStyle(activeDocument.body);
	return {
		bg: root.getPropertyValue('--background-primary').trim() || '#ffffff',
		headerBg:
			root.getPropertyValue('--background-secondary').trim() || '#f5f5f5',
		text: root.getPropertyValue('--text-normal').trim() || '#1e1e1e',
		border: root.getPropertyValue('--background-modifier-border').trim() || '#ddd',
	};
}

function measureColumnWidths(
	cells: string[][],
	ctx: CanvasRenderingContext2D,
): number[] {
	const colCount = Math.max(0, ...cells.map((r) => r.length));
	const widths = new Array<number>(colCount).fill(48);
	const maxCol = 360;

	for (const row of cells) {
		row.forEach((cell, ci) => {
			const w = ctx.measureText(cell).width + CELL_H_PAD * 2;
			widths[ci] = Math.min(maxCol, Math.max(widths[ci] ?? 48, w));
		});
	}
	return widths;
}

function tablePixelSize(
	colWidths: number[],
	rowCount: number,
): { width: number; height: number } {
	const width =
		colWidths.reduce((a, b) => a + b, 0) + BORDER * (colWidths.length + 1);
	const dataRows = Math.max(0, rowCount - 1);
	const height =
		BORDER +
		HEADER_HEIGHT +
		BORDER +
		dataRows * (ROW_HEIGHT + BORDER) +
		BORDER;
	return { width, height };
}

function drawTable(
	ctx: CanvasRenderingContext2D,
	cells: string[][],
	colWidths: number[],
	colors: ReturnType<typeof readThemeColors>,
): { width: number; height: number } {
	const { width: totalWidth, height: totalHeight } = tablePixelSize(
		colWidths,
		cells.length,
	);
	let y = BORDER;

	ctx.fillStyle = colors.bg;
	ctx.fillRect(0, 0, totalWidth, totalHeight);

	const header = cells[0] ?? [];
	ctx.fillStyle = colors.headerBg;
	ctx.fillRect(0, y, totalWidth, HEADER_HEIGHT);
	ctx.fillStyle = colors.text;
	ctx.font = `600 ${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

	let x = BORDER;
	for (let ci = 0; ci < colWidths.length; ci++) {
		const cw = colWidths[ci] ?? 48;
		ctx.strokeStyle = colors.border;
		ctx.strokeRect(x, y, cw, HEADER_HEIGHT);
		ctx.fillText(
			header[ci] ?? '',
			x + CELL_H_PAD,
			y + HEADER_HEIGHT / 2 + FONT_SIZE / 3,
		);
		x += cw + BORDER;
	}
	y += HEADER_HEIGHT + BORDER;

	ctx.font = `400 ${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

	for (let ri = 1; ri < cells.length; ri++) {
		const row = cells[ri] ?? [];
		x = BORDER;
		for (let ci = 0; ci < colWidths.length; ci++) {
			const cw = colWidths[ci] ?? 48;
			ctx.fillStyle = colors.bg;
			ctx.fillRect(x, y, cw, ROW_HEIGHT);
			ctx.strokeStyle = colors.border;
			ctx.strokeRect(x, y, cw, ROW_HEIGHT);
			ctx.fillStyle = colors.text;
			ctx.fillText(
				row[ci] ?? '',
				x + CELL_H_PAD,
				y + ROW_HEIGHT / 2 + FONT_SIZE / 3,
			);
			x += cw + BORDER;
		}
		y += ROW_HEIGHT + BORDER;
	}

	return { width: totalWidth, height: totalHeight };
}

export async function copyTableMatrixAsImage(
	cells: string[][],
): Promise<void> {
	if (cells.length === 0) {
		throw new Error('empty table');
	}

	const colors = readThemeColors();
	const canvas = activeDocument.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('canvas unsupported');
	}

	ctx.font = `400 ${FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
	const colWidths = measureColumnWidths(cells, ctx);
	const { width, height } = tablePixelSize(colWidths, cells.length);

	const dpr = window.devicePixelRatio || 1;
	canvas.width = Math.ceil(width * dpr);
	canvas.height = Math.ceil(height * dpr);

	const drawCtx = canvas.getContext('2d')!;
	drawCtx.scale(dpr, dpr);
	drawCtx.font = ctx.font;
	drawTable(drawCtx, cells, colWidths, colors);

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob((b) => {
			if (b) {
				resolve(b);
			} else {
				reject(new Error('toBlob failed'));
			}
		}, 'image/png');
	});

	await navigator.clipboard.write([
		new ClipboardItem({ 'image/png': blob }),
	]);
}

export async function copyMarkdownTableAtLineAsImage(
	lines: string[],
	lineIndex: number,
): Promise<{ rowCount: number }> {
	const block = findTableAtLine(lines, lineIndex);
	if (!block) {
		throw new Error('not in table');
	}
	const cells = tableBlockToCellMatrix(block);
	await copyTableMatrixAsImage(cells);
	return { rowCount: block.rows.length };
}
