import { FileSystemAdapter, Notice, Plugin, TFile } from 'obsidian';

async function copyText(text: string): Promise<void> {
	await navigator.clipboard.writeText(text);
}

function getActiveMarkdownFile(plugin: Plugin): TFile | null {
	return plugin.app.workspace.getActiveFile();
}

export function registerCopyPathCommands(plugin: Plugin): void {
	plugin.addCommand({
		id: 'copy-vault-relative-path',
		name: 'Copy vault-relative path',
		callback: () => {
			const file = getActiveMarkdownFile(plugin);
			if (!file) {
				new Notice('没有打开的文件');
				return;
			}

			void copyText(file.path).then(() => {
				new Notice(`已复制：${file.path}`);
			});
		},
	});

	plugin.addCommand({
		id: 'copy-absolute-path',
		name: 'Copy absolute path',
		callback: () => {
			const file = getActiveMarkdownFile(plugin);
			if (!file) {
				new Notice('没有打开的文件');
				return;
			}

			const adapter = plugin.app.vault.adapter;
			if (!(adapter instanceof FileSystemAdapter)) {
				new Notice('当前库不支持复制绝对路径');
				return;
			}

			const absolutePath = adapter.getFullPath(file.path);
			void copyText(absolutePath).then(() => {
				new Notice(`已复制：${absolutePath}`);
			});
		},
	});
}
