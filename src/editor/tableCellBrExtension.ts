import { EditorSelection, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { isInMarkdownTableCell } from '../utils/isInMarkdownTableCell';

const BR = '<br>';

export function createTableCellBrExtension() {
	return Prec.high(
		keymap.of([
			{
				key: 'Enter',
				run: (view) => {
					if (!isInMarkdownTableCell(view)) {
						return false;
					}

					const { from, to } = view.state.selection.main;

					view.dispatch({
						changes: { from, to, insert: BR },
						selection: EditorSelection.cursor(from + BR.length),
						userEvent: 'input.type',
					});

					return true;
				},
			},
		]),
	);
}
