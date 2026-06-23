import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { editorInfoField } from 'obsidian';

const TABLE_CELL_WRAPPER_CLASS = 'table-cell-wrapper';

function isInCodeBlock(state: EditorState, pos: number): boolean {
	let inCode = false;
	syntaxTree(state).iterate({
		from: pos,
		to: pos,
		enter(node) {
			const name = node.type.name;
			if (
				name === 'inline-code' ||
				name === 'FencedCode' ||
				name === 'CodeBlock' ||
				name.includes('codeblock')
			) {
				inCode = true;
			}
		},
	});
	return inCode;
}

function isInSyntaxTable(state: EditorState, pos: number): boolean {
	let inTable = false;
	syntaxTree(state).iterate({
		from: pos,
		to: pos,
		enter(node) {
			if (node.type.name === 'Table') {
				inTable = true;
			}
		},
	});
	return inTable;
}

function isTableSeparatorRow(lineText: string): boolean {
	const trimmed = lineText.trim();
	if (!trimmed.includes('|')) {
		return false;
	}

	const cells = trimmed.split('|').slice(1, -1);
	if (cells.length === 0) {
		return false;
	}

	return cells.every((cell) => /^\s*:?-+:?\s*$/.test(cell));
}

function isCursorInTableCellContent(state: EditorState, pos: number): boolean {
	const line = state.doc.lineAt(pos);
	const lineText = line.text;

	if (!lineText.includes('|')) {
		return false;
	}

	if (isTableSeparatorRow(lineText)) {
		return false;
	}

	const pipePositions: number[] = [];
	for (let i = 0; i < lineText.length; i++) {
		if (lineText[i] === '|' && (i === 0 || lineText[i - 1] !== '\\')) {
			pipePositions.push(line.from + i);
		}
	}

	if (pipePositions.length < 2) {
		return false;
	}

	for (let i = 0; i < pipePositions.length - 1; i++) {
		const cellStart = pipePositions[i]! + 1;
		const cellEnd = pipePositions[i + 1]!;
		if (pos >= cellStart && pos < cellEnd) {
			return true;
		}
	}

	return false;
}

export function isInMarkdownTableCell(view: EditorView): boolean {
	if (view.dom.closest(`.${TABLE_CELL_WRAPPER_CLASS}`)) {
		return true;
	}

	try {
		const info = view.state.field(editorInfoField, false);
		if (!info) {
			return false;
		}
	} catch {
		return false;
	}

	const pos = view.state.selection.main.head;

	if (isInCodeBlock(view.state, pos)) {
		return false;
	}

	if (!isInSyntaxTable(view.state, pos)) {
		return false;
	}

	return isCursorInTableCellContent(view.state, pos);
}
