import { Editor, MarkdownView } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { applyFormatAction } from './actions';
import { FORMAT_ACTIONS, FormatAction } from './types';

type EditorWithCm = Editor & { cm?: EditorView };

const HANDLE_SIZE = 28;
const GUTTER_GAP = 6;
const EDGE_MARGIN = 8;

export class FloatingToolbarController {
	readonly view: MarkdownView;
	private readonly root: HTMLElement;
	private readonly handle: HTMLButtonElement;
	private readonly popover: HTMLElement;
	private readonly disposers: Array<() => void> = [];
	private popoverOpen = false;

	constructor(view: MarkdownView) {
		this.view = view;
		this.root = createDiv({ cls: 'mfp-float-toolbar' });
		this.handle = this.root.createEl('button', {
			cls: 'mfp-t-handle',
			text: 'T',
			attr: { type: 'button', 'aria-label': '排版工具栏' },
		});
		this.popover = this.root.createDiv({ cls: 'mfp-popover' });
		this.popover.createDiv({ cls: 'mfp-popover-title', text: '排版' });
		const grid = this.popover.createDiv({ cls: 'mfp-action-grid' });

		for (const def of FORMAT_ACTIONS) {
			const button = grid.createEl('button', {
				cls: 'mfp-action-btn',
				text: def.label,
				attr: { type: 'button', title: def.title },
			});
			button.dataset.action = def.action;
			if (def.action === 'italic') {
				button.addClass('mfp-action-italic');
			}
			if (def.action === 'strikethrough') {
				button.addClass('mfp-action-strike');
			}
		}

		this.handle.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.togglePopover();
		});

		grid.addEventListener('click', (event) => {
			const target = (event.target as HTMLElement).closest(
				'button[data-action]',
			);
			if (!(target instanceof HTMLButtonElement) || !target.dataset.action) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			applyFormatAction(this.view.editor, target.dataset.action as FormatAction);
			this.closePopover();
		});
	}

	attach(): void {
		this.view.contentEl.addClass('mfp-float-toolbar-host');
		this.view.contentEl.appendChild(this.root);
		this.updatePosition();

		const cm = (this.view.editor as EditorWithCm).cm;
		if (cm) {
			const onScroll = () => {
				this.updatePosition();
			};
			cm.scrollDOM.addEventListener('scroll', onScroll, { passive: true });
			this.disposers.push(() => {
				cm.scrollDOM.removeEventListener('scroll', onScroll);
			});
		}
	}

	destroy(): void {
		while (this.disposers.length > 0) {
			this.disposers.pop()?.();
		}
		this.root.remove();
		this.view.contentEl.removeClass('mfp-float-toolbar-host');
	}

	handleOutsideClick(target: Node): void {
		if (!this.popoverOpen || this.root.contains(target)) {
			return;
		}
		this.closePopover();
	}

	updatePosition(editor: Editor = this.view.editor): void {
		const cm = (editor as EditorWithCm).cm;
		if (!cm) {
			this.root.addClass('is-hidden');
			return;
		}

		const head = cm.state.selection.main.head;
		const line = cm.state.doc.lineAt(head);
		const lineCoords = cm.coordsAtPos(line.from);
		if (!lineCoords) {
			this.root.addClass('is-hidden');
			return;
		}

		const hostRect = this.view.contentEl.getBoundingClientRect();
		// T 固定在行首左侧边距，不压在文字上
		const top =
			lineCoords.top -
			hostRect.top +
			(lineCoords.bottom - lineCoords.top - HANDLE_SIZE) / 2;
		const left =
			lineCoords.left - hostRect.left - HANDLE_SIZE - GUTTER_GAP;

		this.root.removeClass('is-hidden');
		this.layoutWithinEditor(left, top);
	}

	private layoutWithinEditor(left: number, top: number): void {
		const hostW = this.view.contentEl.clientWidth;
		const hostH = this.view.contentEl.clientHeight;

		this.root.removeClass('mfp-popover-flip-up');
		this.root.setCssProps({ top: `${top}px`, left: `${left}px` });

		let rootW = this.root.offsetWidth || 220;
		let rootH = this.root.offsetHeight || HANDLE_SIZE;

		let x = Math.max(EDGE_MARGIN, Math.min(left, hostW - rootW - EDGE_MARGIN));
		let y = Math.max(EDGE_MARGIN, top);

		if (this.popoverOpen && y + rootH > hostH - EDGE_MARGIN) {
			this.root.addClass('mfp-popover-flip-up');
			rootH = this.root.offsetHeight || rootH;
			y = Math.max(EDGE_MARGIN, top - rootH + HANDLE_SIZE);
		}

		if (y + rootH > hostH - EDGE_MARGIN) {
			y = Math.max(EDGE_MARGIN, hostH - rootH - EDGE_MARGIN);
		}

		if (x + rootW > hostW - EDGE_MARGIN) {
			x = Math.max(EDGE_MARGIN, hostW - rootW - EDGE_MARGIN);
		}

		this.root.setCssProps({
			top: `${y}px`,
			left: `${x}px`,
		});
	}

	private togglePopover(): void {
		this.popoverOpen = !this.popoverOpen;
		this.popover.toggleClass('is-open', this.popoverOpen);
		this.handle.toggleClass('is-active', this.popoverOpen);
		this.updatePosition();
	}

	private closePopover(): void {
		this.popoverOpen = false;
		this.popover.removeClass('is-open');
		this.handle.removeClass('is-active');
		this.updatePosition();
	}
}
