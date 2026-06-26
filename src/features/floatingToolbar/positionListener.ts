import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { FloatingToolbarController } from './toolbar';

let activeController: FloatingToolbarController | null = null;

export function setFloatingToolbarController(
	controller: FloatingToolbarController | null,
): void {
	activeController = controller;
}

export function createFloatingToolbarPositionExtension(): Extension {
	return EditorView.updateListener.of((update) => {
		if (!activeController) {
			return;
		}

		const cm = (activeController.view.editor as { cm?: EditorView }).cm;
		if (cm !== update.view) {
			return;
		}

		if (update.selectionSet || update.viewportChanged || update.geometryChanged) {
			activeController.updatePosition();
		}
	});
}
