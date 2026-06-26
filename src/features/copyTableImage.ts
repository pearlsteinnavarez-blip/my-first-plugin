import { MarkdownView, Notice, Plugin } from 'obsidian';
import { findTableAtLine } from '../utils/markdownTable';
import { copyMarkdownTableAtLineAsImage } from '../utils/tableToImage';

export function registerCopyTableImageCommand(plugin: Plugin): void {
	plugin.addCommand({
		id: 'copy-table-as-image',
		name: 'Copy table as image',
		callback: () => {
			const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) {
				new Notice('请先打开 Markdown 笔记');
				return;
			}

			const editor = view.editor;
			const line = editor.getCursor().line;
			const lines = editor.getValue().split('\n');
			const block = findTableAtLine(lines, line);
			if (!block) {
				new Notice('请将光标放在表格内');
				return;
			}

			void copyMarkdownTableAtLineAsImage(lines, line)
				.then(({ rowCount }) => {
					new Notice(`已复制表格图片（${rowCount + 1} 行含表头）`);
				})
				.catch((err: unknown) => {
					const msg = err instanceof Error ? err.message : String(err);
					new Notice(`复制失败：${msg}`);
				});
		},
	});
}
