import { App, FileSystemAdapter, requestUrl } from 'obsidian';
import { resolvePluginRepo } from './registry';
import { pluginManifestPath, readInstalledManifest } from './scanInstalled';
import type { GitHubRelease, PluginUpdateResult } from './types';
import { compareVersions } from './version';

const RELEASE_FILES = ['main.js', 'manifest.json', 'styles.css'] as const;
const SELF_PLUGIN_ID = 'my-first-plugin';

function releaseDownloadUrl(repo: string, tag: string, fileName: string): string {
	return `https://github.com/${repo}/releases/download/${tag}/${fileName}`;
}

async function fetchLatestRelease(repo: string): Promise<GitHubRelease> {
	const response = await requestUrl({
		url: `https://api.github.com/repos/${repo}/releases/latest`,
		headers: { Accept: 'application/vnd.github+json' },
	});
	return response.json as GitHubRelease;
}

async function downloadReleaseFile(url: string): Promise<string> {
	const response = await requestUrl({ url });
	return response.text;
}

export async function updatePluginIfNeeded(
	app: App,
	pluginId: string,
): Promise<PluginUpdateResult> {
	if (pluginId === SELF_PLUGIN_ID) {
		return {
			id: pluginId,
			status: 'skipped',
			message: '本地开发插件请使用 npm run deploy 更新',
		};
	}

	const adapter = app.vault.adapter;
	if (!(adapter instanceof FileSystemAdapter)) {
		return { id: pluginId, status: 'error', message: '仅支持桌面端' };
	}

	const manifest = readInstalledManifest(app, pluginId);
	if (!manifest) {
		return { id: pluginId, status: 'error', message: '未找到 manifest.json' };
	}

	const repo = await resolvePluginRepo(pluginId);
	if (!repo) {
		return { id: pluginId, status: 'skipped', message: '未找到 GitHub 更新源' };
	}

	const before = manifest.version;
	let release: GitHubRelease;
	try {
		release = await fetchLatestRelease(repo);
	} catch {
		return { id: pluginId, status: 'error', message: `无法获取 ${repo} 的最新 Release` };
	}

	const remoteVersion = release.tag_name.replace(/^v/i, '');
	if (compareVersions(remoteVersion, before) <= 0) {
		return {
			id: pluginId,
			status: 'up-to-date',
			before,
			after: before,
		};
	}

	const tag = release.tag_name;
	const root = pluginManifestPath(app, pluginId);

	for (const fileName of RELEASE_FILES) {
		const asset = release.assets?.find((a) => a.name === fileName);
		const url =
			asset?.browser_download_url ?? releaseDownloadUrl(repo, tag, fileName);

		try {
			const content = await downloadReleaseFile(url);

			if (fileName === 'manifest.json') {
				const remoteManifest = JSON.parse(content) as { id?: string; version?: string };
				if (remoteManifest.id && remoteManifest.id !== pluginId) {
					manifest.version = remoteVersion;
					await adapter.write(
						`${root}/manifest.json`,
						`${JSON.stringify(manifest, null, 2)}\n`,
					);
					continue;
				}
			}

			await adapter.write(`${root}/${fileName}`, content);
		} catch {
			if (fileName === 'styles.css') {
				continue;
			}
			return {
				id: pluginId,
				status: 'error',
				message: `下载 ${fileName} 失败`,
			};
		}
	}

	return {
		id: pluginId,
		status: 'updated',
		before,
		after: remoteVersion,
	};
}
