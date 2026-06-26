/** Markdown 表格解析（与视口无关，读全文） */

export function isTableSeparatorRow(line: string): boolean {
	return /^\|[\s\-:|]+\|$/.test(line.trim());
}

export function isTableRow(line: string): boolean {
	const t = line.trim();
	return t.startsWith('|') && t.endsWith('|') && !isTableSeparatorRow(t);
}

export interface TableBlock {
	header: string;
	separator: string;
	rows: string[];
}

export function splitTableRow(row: string): string[] {
	const inner = row.trim().replace(/^\|/, '').replace(/\|$/, '');
	return inner.split('|').map((c) => c.trim());
}

/** 单元格展示文本（去 markdown 标记） */
export function cellDisplayText(cell: string): string {
	return cell
		.replace(/\*\*/g, '')
		.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, '$2')
		.replace(/\[\[([^\]]+)\]\]/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.trim();
}

/** 光标所在行的完整 markdown 表格（含未显示在屏幕上的行） */
export function findTableAtLine(
	lines: string[],
	lineIndex: number,
): TableBlock | null {
	if (lineIndex < 0 || lineIndex >= lines.length) {
		return null;
	}

	const cur = lines[lineIndex]?.trim() ?? '';
	if (!isTableRow(cur) && !isTableSeparatorRow(cur)) {
		return null;
	}

	let start = lineIndex;
	while (start > 0) {
		const prev = lines[start - 1]?.trim() ?? '';
		if (!isTableRow(prev) && !isTableSeparatorRow(prev)) {
			break;
		}
		start--;
	}

	let i = start;
	while (i < lines.length && !lines[i]?.trim()) {
		i++;
	}

	const header = lines[i]?.trim();
	if (!header || !isTableRow(header)) {
		return null;
	}
	i++;

	while (i < lines.length && !lines[i]?.trim()) {
		i++;
	}

	const separator = lines[i]?.trim();
	if (!separator || !isTableSeparatorRow(separator)) {
		return null;
	}
	i++;

	const rows: string[] = [];
	while (i < lines.length) {
		const t = lines[i]?.trim() ?? '';
		if (!t || !isTableRow(t)) {
			break;
		}
		rows.push(t);
		i++;
	}

	return { header, separator, rows };
}

export function tableBlockToCellMatrix(block: TableBlock): string[][] {
	const headerCells = splitTableRow(block.header).map(cellDisplayText);
	const dataRows = block.rows.map((row) =>
		splitTableRow(row).map(cellDisplayText),
	);
	return [headerCells, ...dataRows];
}
