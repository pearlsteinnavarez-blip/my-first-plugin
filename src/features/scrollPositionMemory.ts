import { MarkdownView, Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';

type EditorWithCm = { cm?: EditorView };

const SAVE_INTERVAL_MS = 250;
const RESTORE_ATTEMPTS = 12;
const RESTORE_INTERVAL_MS = 60;

const hookedViews = new WeakSet<MarkdownView>();
const scrollBoundViews = new WeakSet<MarkdownView>();

function isEditingTableCell(view: MarkdownView): boolean {
	return !!view.contentEl.querySelector(
		'.table-cell-wrapper .cm-editor.cm-focused, .cm-table-widget .cm-editor.cm-focused',
	);
}

function readScroll(view: MarkdownView): number | null {
	if (isEditingTableCell(view)) {
		return null;
	}

	try {
		return view.currentMode.getScroll();
	} catch {
		return null;
	}
}

function applyScroll(view: MarkdownView, scroll: number): void {
	try {
		view.currentMode.applyScroll(scroll);
	} catch {
		// ignore
	}
}

function persistScroll(
	positions: Map<string, number>,
	path: string,
	scroll: number | null,
): void {
	if (scroll === null) {
		return;
	}

	const previous = positions.get(path);
	if (scroll === 0 && previous !== undefined && previous > 50) {
		return;
	}

	positions.set(path, scroll);
}

function saveViewScroll(
	view: MarkdownView | null,
	positions: Map<string, number>,
): void {
	if (!view?.file) {
		return;
	}
	persistScroll(positions, view.file.path, readScroll(view));
}

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
		persistScroll(positions, file.path, readScroll(view));
		await originalUnload(file);
	};
}

function hookMarkdownView(
	view: MarkdownView | null,
	positions: Map<string, number>,
): void {
	if (!view) {
		return;
	}
	attachSaveOnUnload(view, positions);
}

export function registerScrollPositionMemory(plugin: Plugin): void {
	const positions = new Map<string, number>();
	let activeView: MarkdownView | null = null;
	let lastActivePath: string | null = null;
	let isRestoring = false;
	let restoreTimer: number | null = null;

	const cancelRestore = () => {
		if (restoreTimer !== null) {
			window.clearTimeout(restoreTimer);
			restoreTimer = null;
		}
	};

	const restoreWithRetries = (view: MarkdownView, scroll: number) => {
		cancelRestore();
		let attempt = 0;

		const step = () => {
			if (attempt >= RESTORE_ATTEMPTS) {
				isRestoring = false;
				restoreTimer = null;
				return;
			}

			if (isEditingTableCell(view)) {
				isRestoring = false;
				restoreTimer = null;
				return;
			}

			attempt++;
			isRestoring = true;

			try {
				const current = readScroll(view);
				if (current !== null && Math.abs(current - scroll) < 16) {
					isRestoring = false;
					restoreTimer = null;
					return;
				}
				applyScroll(view, scroll);
			} catch {
				// ignore and retry
			}

			isRestoring = false;
			restoreTimer = window.setTimeout(step, RESTORE_INTERVAL_MS);
		};

		restoreTimer = window.setTimeout(step, RESTORE_INTERVAL_MS);
	};

	const bindScrollWatcher = (view: MarkdownView) => {
		if (scrollBoundViews.has(view)) {
			return;
		}
		scrollBoundViews.add(view);

		const cm = (view.editor as EditorWithCm).cm;
		if (!cm) {
			return;
		}

		const onScroll = () => {
			if (isRestoring) {
				return;
			}
			if (!view.file) {
				return;
			}
			persistScroll(positions, view.file.path, readScroll(view));
		};

		cm.scrollDOM.addEventListener('scroll', onScroll, { passive: true });
		plugin.register(() => {
			cm.scrollDOM.removeEventListener('scroll', onScroll);
		});
	};

	plugin.app.workspace.onLayoutReady(() => {
		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		activeView = view;
		if (view) {
			hookMarkdownView(view, positions);
			bindScrollWatcher(view);
			lastActivePath = view.file?.path ?? null;
		}

		plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) {
				hookMarkdownView(leaf.view, positions);
			}
		});
	});

	plugin.registerInterval(
		window.setInterval(() => {
			saveViewScroll(activeView, positions);
		}, SAVE_INTERVAL_MS),
	);

	plugin.registerEvent(
		plugin.app.workspace.on('active-leaf-change', () => {
			cancelRestore();
			saveViewScroll(activeView, positions);

			const current = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (current) {
				hookMarkdownView(current, positions);
				bindScrollWatcher(current);

				const path = current.file?.path ?? null;
				if (path && path !== lastActivePath) {
					const saved = positions.get(path);
					if (saved !== undefined && saved > 0) {
						restoreWithRetries(current, saved);
					}
				}
				lastActivePath = path;
			} else {
				lastActivePath = null;
			}

			activeView = current;
		}),
	);

	plugin.register(() => {
		cancelRestore();
	});
}
