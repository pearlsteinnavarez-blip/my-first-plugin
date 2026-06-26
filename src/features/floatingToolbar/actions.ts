import { Editor } from 'obsidian';
import { FormatAction } from './types';

const LINE_PREFIX_RE =
	/^#{1,6}\s+|^>\s+|^[-*+]\s+|^\d+\.\s+|^-\s\[[ xX]\]\s+/;

function stripLinePrefix(line: string): string {
	return line.replace(LINE_PREFIX_RE, '');
}

function wrapSelection(editor: Editor, before: string, after: string): void {
	const selection = editor.getSelection();
	if (selection) {
		editor.replaceSelection(`${before}${selection}${after}`);
		return;
	}

	editor.replaceSelection(`${before}${after}`);
	const cursor = editor.getCursor();
	editor.setCursor({ line: cursor.line, ch: cursor.ch - after.length });
}

function prefixCurrentLine(editor: Editor, prefix: string): void {
	const cursor = editor.getCursor();
	const line = editor.getLine(cursor.line);
	editor.setLine(cursor.line, `${prefix}${stripLinePrefix(line)}`);
}

function setHeading(editor: Editor, level: number): void {
	prefixCurrentLine(editor, `${'#'.repeat(level)} `);
}

export function applyFormatAction(editor: Editor, action: FormatAction): void {
	switch (action) {
		case 'h1':
			setHeading(editor, 1);
			break;
		case 'h2':
			setHeading(editor, 2);
			break;
		case 'h3':
			setHeading(editor, 3);
			break;
		case 'h4':
			setHeading(editor, 4);
			break;
		case 'italic':
			wrapSelection(editor, '*', '*');
			break;
		case 'strikethrough':
			wrapSelection(editor, '~~', '~~');
			break;
		case 'bullet':
			prefixCurrentLine(editor, '- ');
			break;
		case 'numbered':
			prefixCurrentLine(editor, '1. ');
			break;
		case 'todo':
			prefixCurrentLine(editor, '- [ ] ');
			break;
		case 'code':
			wrapSelection(editor, '`', '`');
			break;
		case 'quote':
			prefixCurrentLine(editor, '> ');
			break;
		case 'highlight':
			wrapSelection(editor, '==', '==');
			break;
		case 'callout': {
			const cursor = editor.getCursor();
			editor.replaceRange('> [!note]\n> \n', cursor);
			editor.setCursor({ line: cursor.line + 1, ch: 2 });
			break;
		}
		case 'divider': {
			const cursor = editor.getCursor();
			editor.replaceRange('\n---\n', cursor);
			break;
		}
	}
}
