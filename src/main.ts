import { Plugin } from 'obsidian';
import { createTableCellBrExtension } from './editor/tableCellBrExtension';

export default class TableCellBrPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(createTableCellBrExtension());
	}
}
