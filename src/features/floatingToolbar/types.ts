export type FormatAction =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'italic'
	| 'strikethrough'
	| 'bullet'
	| 'numbered'
	| 'todo'
	| 'code'
	| 'quote'
	| 'highlight'
	| 'callout'
	| 'divider';

export type FormatActionDef = {
	action: FormatAction;
	label: string;
	title: string;
};

export const FORMAT_ACTIONS: FormatActionDef[] = [
	{ action: 'h1', label: 'H1', title: '一级标题' },
	{ action: 'h2', label: 'H2', title: '二级标题' },
	{ action: 'h3', label: 'H3', title: '三级标题' },
	{ action: 'h4', label: 'H4', title: '四级标题' },
	{ action: 'italic', label: 'I', title: '斜体' },
	{ action: 'strikethrough', label: 'S', title: '删除线' },
	{ action: 'bullet', label: '•', title: '无序列表' },
	{ action: 'numbered', label: '1.', title: '有序列表' },
	{ action: 'todo', label: '☑', title: '任务列表' },
	{ action: 'code', label: '<>', title: '行内代码' },
	{ action: 'quote', label: '""', title: '引用' },
	{ action: 'highlight', label: 'H', title: '高亮' },
	{ action: 'callout', label: '⚡', title: 'Callout' },
	{ action: 'divider', label: '—', title: '分割线' },
];
