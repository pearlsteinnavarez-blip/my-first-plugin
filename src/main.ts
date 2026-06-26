import { Plugin } from 'obsidian';
import { registerCopyTableImageCommand } from './features/copyTableImage';
import { registerCopyPathCommands } from './features/copyPath';
import { registerFloatingToolbar } from './features/floatingToolbar';
import { createTableCellBrExtension } from './editor/tableCellBrExtension';
import { registerScrollPositionMemory } from './features/scrollPositionMemory';
import {
	registerPluginAutoUpdater,
	PluginAutoUpdater,
} from './features/pluginAutoUpdate/autoUpdater';
import {
	DEFAULT_SETTINGS,
	PluginSettingTabView,
	type PluginSettings,
} from './settings';

export default class TableCellBrPlugin extends Plugin {
	settings!: PluginSettings;
	autoUpdater!: PluginAutoUpdater;

	async onload() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		);
		if (!this.settings.autoUpdateWhitelist) {
			this.settings.autoUpdateWhitelist = {};
		}

		this.registerEditorExtension(createTableCellBrExtension());
		registerScrollPositionMemory(this);
		registerCopyPathCommands(this);
		registerCopyTableImageCommand(this);
		registerFloatingToolbar(this);

		this.autoUpdater = registerPluginAutoUpdater(this);
		this.addSettingTab(new PluginSettingTabView(this.app, this));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
