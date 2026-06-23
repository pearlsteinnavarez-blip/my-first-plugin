import { Plugin } from 'obsidian';
import { createTableCellBrExtension } from './editor/tableCellBrExtension';
import { registerScrollPositionMemory } from './features/scrollPositionMemory';

export default class TableCellBrPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(createTableCellBrExtension());
		registerScrollPositionMemory(this);
	}
}
