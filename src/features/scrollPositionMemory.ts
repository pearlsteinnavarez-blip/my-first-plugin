import { MarkdownView, Plugin } from 'obsidian';

const SAVE_INTERVAL_MS = 250;
const RESTORE_ATTEMPTS = 10;
const RESTORE_INTERVAL_MS = 60;

const hookedViews = new WeakSet<MarkdownView>();

function attachSaveOnUnload(
	view: MarkdownView,
	positions: Map<string, number>,
): void {
	if (hookedViews.has(view)) {
		return;
	}
	hookedViews.add(view);

	const originalUnload = view.onUnloadFile.bind(view);
	view.onUnloadFile = async (file) => {
		try {
			positions.set(file.path, view.currentMode.getScroll());
		} catch {
			// view may already be tearing down
		}
		await originalUnload(file);
	};
}

function hookActiveMarkdownViews(
	plugin: Plugin,
	positions: Map<string, number>,
): void {
	const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	if (view) {
		attachSaveOnUnload(view, positions);
	}

	plugin.app.workspace.iterateAllLeaves((leaf) => {
		if (leaf.view instanceof MarkdownView) {
			attachSaveOnUnload(leaf.view, positions);
		}
	});
}

function restoreScroll(view: MarkdownView, scroll: number): void {
	let attempt = 0;

	const apply = () => {
		try {
			view.currentMode.applyScroll(scroll);
		} catch {
			// editor may not be ready yet
		}

		attempt++;
		if (attempt < RESTORE_ATTEMPTS) {
			window.setTimeout(apply, RESTORE_INTERVAL_MS);
		}
	};

	window.requestAnimationFrame(apply);
}

export function registerScrollPositionMemory(plugin: Plugin): void {
	const positions = new Map<string, number>();

	const saveActiveScroll = () => {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file) {
			return;
		}

		try {
			positions.set(view.file.path, view.currentMode.getScroll());
		} catch {
			// ignore
		}
	};

	const tryRestoreActive = () => {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view?.file) {
			return;
		}

		const scroll = positions.get(view.file.path);
		if (scroll === undefined) {
			return;
		}

		restoreScroll(view, scroll);
	};

	plugin.app.workspace.onLayoutReady(() => {
		hookActiveMarkdownViews(plugin, positions);
	});

	plugin.registerInterval(
		window.setInterval(saveActiveScroll, SAVE_INTERVAL_MS),
	);

	plugin.registerEvent(
		plugin.app.workspace.on('active-leaf-change', () => {
			hookActiveMarkdownViews(plugin, positions);
			tryRestoreActive();
		}),
	);

	plugin.registerEvent(
		plugin.app.workspace.on('file-open', () => {
			hookActiveMarkdownViews(plugin, positions);
			tryRestoreActive();
		}),
	);
}
