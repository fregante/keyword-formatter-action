function escapeRegExp(string) {
	return string.replaceAll(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

export function formatTitle(title, {
	keywords,
	prefix = '',
}) {
	// Split by backticks to separate code and non-code sections
	const parts = title.split('`');

	// Only format keywords in non-code sections (even-indexed parts)
	for (let i = 0; i < parts.length; i += 2) {
		let part = parts[i];

		for (const keyword of keywords) {
			const regex = new RegExp(
				String.raw`(^|[^-_])\b(`
				+ `(?:${escapeRegExp(prefix)})?`
				+ escapeRegExp(keyword)
				+ String.raw`)\b([^-_]|$)`,
				'gi',
			);

			part = part.replace(regex, (
				_,
				before,
				keywordMatch,
				after,
			) => `${before}\`${keywordMatch}\`${after}`);
		}

		parts[i] = part;
	}

	return parts.join('`');
}
