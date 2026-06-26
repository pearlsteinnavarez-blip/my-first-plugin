export interface InstalledPluginInfo {
	id: string;
	name: string;
	version: string;
}

export interface PluginUpdateResult {
	id: string;
	status: 'updated' | 'up-to-date' | 'skipped' | 'error';
	before?: string;
	after?: string;
	message?: string;
}

export interface PluginManifest {
	id: string;
	name: string;
	version: string;
}

export interface GitHubRelease {
	tag_name: string;
	assets?: Array<{ name: string; browser_download_url: string }>;
}
