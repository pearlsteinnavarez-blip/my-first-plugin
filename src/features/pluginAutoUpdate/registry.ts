import { requestUrl } from 'obsidian';

const COMMUNITY_REGISTRY_URL =
	'https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json';

/** 社区目录里没有或 repo 字段与目录 id 不一致时的补充映射 */
export const REPO_OVERRIDES: Record<string, string> = {
	realclaudian: 'YishenTu/Claudian',
	yolo: 'Lapis0x0/obsidian-yolo',
};

interface CommunityPluginEntry {
	id: string;
	repo?: string;
}

let cachedRepos: Record<string, string> | null = null;
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function resolvePluginRepo(pluginId: string): Promise<string | null> {
	const repos = await loadCommunityRepos();
	return REPO_OVERRIDES[pluginId] ?? repos[pluginId] ?? null;
}

export async function loadCommunityRepos(): Promise<Record<string, string>> {
	const now = Date.now();
	if (cachedRepos && now - cacheFetchedAt < CACHE_TTL_MS) {
		return cachedRepos;
	}

	const response = await requestUrl({ url: COMMUNITY_REGISTRY_URL });
	const entries = response.json as CommunityPluginEntry[];
	const repos: Record<string, string> = { ...REPO_OVERRIDES };

	for (const entry of entries) {
		if (entry.id && entry.repo) {
			repos[entry.id] = entry.repo;
		}
	}

	cachedRepos = repos;
	cacheFetchedAt = now;
	return repos;
}
