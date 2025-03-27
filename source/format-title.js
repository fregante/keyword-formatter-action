function escapeRegExp(string) {
	return string.replaceAll(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

export function formatTitle(title, {
	keywords,
	prefix = '',
}) {
	let newTitle = title;

	for (const keyword of keywords) {
		const regex = new RegExp(
			String.raw`(^|[^-_\`])\b(`
			+ `(?:${escapeRegExp(prefix)})?`
			+ escapeRegExp(keyword)
			+ String.raw`)\b([^-_\`]|$)`,
			'gi',
		);

		newTitle = newTitle.replace(regex, (
			_,
			before,
			keywordMatch,
			after,
		) => `${before}\`${keywordMatch}\`${after}`);
	}

	return newTitle;
}
