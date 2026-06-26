import type { App } from 'obsidian';
import type { InstalledPluginInfo, PluginManifest } from './types';

type PluginsHost = {
	manifests?: Record<string, PluginManifest>;
};

type AppWithPlugins = App & { plugins: PluginsHost };

function getManifestsRecord(app: App): Record<string, PluginManifest> {
	const host = (app as AppWithPlugins).plugins;
	return host.manifests ?? {};
}

export function pluginManifestPath(app: App, pluginId: string): string {
	return `${app.vault.configDir}/plugins/${pluginId}`;
}

export function listInstalledPlugins(app: App): InstalledPluginInfo[] {
	return Object.values(getManifestsRecord(app))
		.filter((manifest) => manifest?.id)
		.map((manifest) => ({
			id: manifest.id,
			name: manifest.name ?? manifest.id,
			version: manifest.version ?? '?',
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

export function readInstalledManifest(
	app: App,
	pluginId: string,
): PluginManifest | null {
	return getManifestsRecord(app)[pluginId] ?? null;
}
