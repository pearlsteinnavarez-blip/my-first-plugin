import { MarkdownView, Plugin } from 'obsidian';
import { createFloatingToolbarPositionExtension, setFloatingToolbarController } from './positionListener';
import { FloatingToolbarController } from './toolbar';

export function registerFloatingToolbar(plugin: Plugin): void {
	let controller: FloatingToolbarController | null = null;

	const attach = () => {
		setFloatingToolbarController(null);
		controller?.destroy();
		controller = null;

		const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			return;
		}

		const cm = (view.editor as { cm?: unknown }).cm;
		if (!cm) {
			return;
		}

		controller = new FloatingToolbarController(view);
		controller.attach();
		setFloatingToolbarController(controller);
	};

	plugin.registerEditorExtension(createFloatingToolbarPositionExtension());

	plugin.app.workspace.onLayoutReady(attach);

	plugin.registerEvent(plugin.app.workspace.on('active-leaf-change', attach));

	plugin.registerEvent(
		plugin.app.workspace.on('editor-change', (editor, ctx) => {
			if (controller && ctx === controller.view) {
				controller.updatePosition(editor);
			}
		}),
	);

	plugin.registerDomEvent(activeDocument, 'mousedown', (event) => {
		if (!controller) {
			return;
		}
		controller.handleOutsideClick(event.target as Node);
	});

	plugin.register(() => {
		setFloatingToolbarController(null);
		controller?.destroy();
		controller = null;
	});
}
