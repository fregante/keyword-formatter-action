import fs from 'node:fs';
import path from 'node:path';
import {
	getInput, getBooleanInput,
} from '@actions/core';

export function parseKeywords(keywords) {
	if (keywords.startsWith('/') && keywords.endsWith('/')) {
		return new RegExp(keywords.slice(1, -1), 'g');
	}

	return keywords.split(/[\n,]+/)
		.map(p => p.trim())
		.filter(Boolean);
}

export function getInputs() {
	const keywords = getInput('keywords');
	const keywordsPath = getInput('keywords-path');
	if (keywords && keywordsPath) {
		throw new Error('Both `keywords` and `keywords-path` inputs are provided. Only one is allowed.');
	}

	if (!keywords && !keywordsPath) {
		throw new Error('Neither `keywords` nor `keywords-path` inputs are provided. One is required.');
	}

	const prefix = getInput('prefix');
	const dryRun = getBooleanInput('dry-run');
	return {
		keywords, keywordsPath, prefix, dryRun,
	};
}

export function processInputs({
	keywords, keywordsPath, prefix, ...inputs
}) {
	if (keywords) {
		keywords = parseKeywords(keywords);
		if (keywords.length === 0) {
			throw new Error('No keywords found in `keywords`' + (keywordsPath ? ` or \`keywords-path: "${keywordsPath}"\`` : ''));
		}
	} else if (keywordsPath) {
		const stats = fs.statSync(keywordsPath);
		if (stats.isDirectory()) {
			keywords = fs.readdirSync(keywordsPath)
				.map(file => path.basename(file).split('.')[0]);

			if (keywords.length === 0) {
				throw new Error('The directory is empty: ' + keywordsPath);
			}
		} else if (stats.isFile()) {
			keywords = parseKeywords(fs.readFileSync(keywordsPath, 'utf8'));

			if (keywords.length === 0) {
				throw new Error('The file is empty: ' + keywordsPath);
			}
		} else {
			throw new Error(`Invalid keywords path: ${keywordsPath}`);
		}
	}

	// Normalize prefix
	prefix = prefix && typeof prefix === 'string' ? prefix : undefined;

	// Deduplicate
	keywords = [...new Set(keywords)];

	return {
		...inputs,
		keywords,
		prefix,
	};
}
