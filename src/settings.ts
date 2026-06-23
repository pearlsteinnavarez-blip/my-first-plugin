import { App, PluginSettingTab, Setting } from 'obsidian';
import TableCellBrPlugin from './main';

export interface PluginSettings {
	placeholder: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	placeholder: 'default',
};

export class PluginSettingTabView extends PluginSettingTab {
	plugin: TableCellBrPlugin;

	constructor(app: App, plugin: TableCellBrPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('p', { text: 'No settings yet.' });
		new Setting(containerEl).setName('Placeholder').setDesc('Reserved for future use');
	}
}
