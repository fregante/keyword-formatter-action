function escapeRegExp(string) {
	return string.replaceAll(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

export function formatTitle(title, {
	keywords,
	prefix = '',
}) {
	// Split by backticks to separate code and non-code sections
	// Even indices (0, 2, 4...) are non-code, odd indices (1, 3, 5...) are code
	const parts = title.split('`');

	// Only format keywords in non-code sections (even-indexed parts)
	for (let i = 0; i < parts.length; i += 2) {
		let part = parts[i];

		for (const keyword of keywords) {
			// Note: Backtick is no longer in the character class because
			// we handle backtick-delimited sections at a higher level
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
