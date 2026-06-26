import { Notice } from 'obsidian';
import type TableCellBrPlugin from '../../main';
import { updatePluginIfNeeded } from './updater';

export class PluginAutoUpdater {
	private running = false;

	constructor(private plugin: TableCellBrPlugin) {}

	async runScheduledCheck(): Promise<void> {
		const ids = this.getWhitelistedIds();
		if (ids.length === 0) {
			return;
		}
		await this.checkPlugins(ids, { quiet: true });
	}

	async checkPlugins(
		pluginIds: string[],
		options: { quiet?: boolean } = {},
	): Promise<void> {
		if (this.running) {
			return;
		}
		this.running = true;

		try {
			for (const id of pluginIds) {
				const result = await updatePluginIfNeeded(this.plugin.app, id);
				if (result.status === 'updated') {
					new Notice(
						`已更新插件 ${id}：${result.before} → ${result.after}。请 Cmd+Q 重启 Obsidian。`,
					);
				} else if (result.status === 'error' && !options.quiet) {
					new Notice(`更新 ${id} 失败：${result.message ?? '未知错误'}`);
				}
			}
		} finally {
			this.running = false;
		}
	}

	getWhitelistedIds(): string[] {
		return Object.entries(this.plugin.settings.autoUpdateWhitelist)
			.filter(([, enabled]) => enabled)
			.map(([id]) => id);
	}
}

export function registerPluginAutoUpdater(plugin: TableCellBrPlugin): PluginAutoUpdater {
	const updater = new PluginAutoUpdater(plugin);

	plugin.app.workspace.onLayoutReady(() => {
		void updater.runScheduledCheck();
	});

	plugin.registerInterval(
		window.setInterval(() => {
			void updater.runScheduledCheck();
		}, 6 * 60 * 60 * 1000),
	);

	return updater;
}
