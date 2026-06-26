import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type TableCellBrPlugin from './main';
import { resolvePluginRepo } from './features/pluginAutoUpdate/registry';
import { listInstalledPlugins } from './features/pluginAutoUpdate/scanInstalled';
import type { InstalledPluginInfo } from './features/pluginAutoUpdate/types';

export interface PluginSettings {
	autoUpdateWhitelist: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	autoUpdateWhitelist: {},
};

export class PluginSettingTabView extends PluginSettingTab {
	plugin: TableCellBrPlugin;
	private installed: InstalledPluginInfo[] = [];

	constructor(app: App, plugin: TableCellBrPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('插件自动更新白名单')
			.setHeading();
		containerEl.createEl('p', {
			text: '为已安装的插件开启自动更新。开启后会在 Obsidian 启动时及每 6 小时检查 GitHub Release，并下载新版本（需联网）。更新后请 Cmd+Q 完全重启 Obsidian。',
		});

		const listHost = containerEl.createDiv({ cls: 'my-first-plugin-auto-update-list' });
		listHost.createEl('p', { text: '正在加载已安装插件…' });

		void this.renderPluginList(listHost);

		new Setting(containerEl)
			.setName('立即检查白名单更新')
			.setDesc('手动触发一次白名单内全部插件的更新检查')
			.addButton((btn) =>
				btn.setButtonText('检查更新').onClick(() => {
					const ids = this.plugin.autoUpdater.getWhitelistedIds();
					if (ids.length === 0) {
						new Notice('请先在下方开启至少一个插件的自动更新');
						return;
					}
					void this.plugin.autoUpdater.checkPlugins(ids).then(() => {
						new Notice('白名单更新检查完成');
					});
				}),
			);
	}

	private async renderPluginList(host: HTMLElement): Promise<void> {
		try {
			this.installed = listInstalledPlugins(this.app);
		} catch {
			host.empty();
			host.createEl('p', { text: '无法读取已安装插件列表' });
			return;
		}

		host.empty();
		if (this.installed.length === 0) {
			host.createEl('p', { text: '未找到已安装插件' });
			return;
		}

		for (const info of this.installed) {
			const repo = await resolvePluginRepo(info.id);
			const isSelf = info.id === 'my-first-plugin';
			const canAutoUpdate = !isSelf && !!repo;
			const descParts = [`${info.id} · v${info.version}`];
			if (isSelf) {
				descParts.push('本地开发插件（请用 npm run deploy）');
			} else if (repo) {
				descParts.push(`源：${repo}`);
			} else {
				descParts.push('无 GitHub 更新源');
			}

			const setting = new Setting(host)
				.setName(info.name)
				.setDesc(descParts.join(' · '));

			if (!canAutoUpdate) {
				continue;
			}

			setting.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoUpdateWhitelist[info.id] ?? false)
					.onChange(async (enabled) => {
						if (enabled) {
							this.plugin.settings.autoUpdateWhitelist[info.id] = true;
						} else {
							delete this.plugin.settings.autoUpdateWhitelist[info.id];
						}
						await this.plugin.saveSettings();
						if (enabled) {
							void this.plugin.autoUpdater
								.checkPlugins([info.id])
								.then(() => new Notice(`已检查 ${info.name} 更新`));
						}
					});
			});
		}
	}
}
