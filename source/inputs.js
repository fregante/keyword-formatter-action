import fs from 'node:fs';
import path from 'node:path';
import {
	getInput, getBooleanInput,
} from '@actions/core';

/**
 * Validates a regex pattern for potential ReDoS vulnerabilities
 * Checks for common ReDoS patterns like nested quantifiers
 */
function validateRegexPattern(pattern) {
	// Check for nested quantifiers which can cause catastrophic backtracking
	const dangerousPatterns = [
		/(\*|\+|{[^}]*})\s*(\*|\+|{[^}]*})/g, // Nested quantifiers like *+
		/(\(.*\*.*\))\s*(\*|\+|{[^}]*})/g, // Quantified groups with stars
		/\([^)]*(\*|\+|{[^}]*})\)(\*|\+|{[^}]*})/g, // Groups with quantifiers that are themselves quantified
	];

	for (const dangerous of dangerousPatterns) {
		if (dangerous.test(pattern)) {
			throw new Error(`Potentially unsafe regex pattern detected: ${pattern}. Avoid nested quantifiers that can cause performance issues.`);
		}
	}

	// Test the regex with a timeout simulation
	try {
		const testRegex = new RegExp(pattern, 'g');
		// Test with a potentially problematic string
		const testString = 'a'.repeat(100);
		testRegex.test(testString);
	} catch (error) {
		throw new Error(`Invalid regex pattern: ${pattern}. ${error.message}`);
	}
}

export function parseKeywords(keywords) {
	if (!keywords || typeof keywords !== 'string') {
		throw new Error('Keywords must be a non-empty string');
	}

	// Trim whitespace and check if empty
	const trimmed = keywords.trim();
	if (trimmed.length === 0) {
		throw new Error('Keywords cannot be empty');
	}

	if (trimmed.startsWith('/') && trimmed.endsWith('/')) {
		const pattern = trimmed.slice(1, -1);

		if (pattern.length === 0) {
			throw new Error('Regex pattern cannot be empty');
		}

		validateRegexPattern(pattern);

		try {
			return new RegExp(pattern, 'g');
		} catch (error) {
			throw new Error(`Invalid regex pattern: ${pattern}. ${error.message}`);
		}
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
		try {
			keywords = parseKeywords(keywords);
		} catch (error) {
			throw new Error(`Failed to parse keywords: ${error.message}`);
		}

		if (keywords.length === 0 && !(keywords instanceof RegExp)) {
			throw new Error('No keywords found in `keywords`' + (keywordsPath ? ` or \`keywords-path: "${keywordsPath}"\`` : ''));
		}
	} else if (keywordsPath) {
		let stats;
		try {
			stats = fs.statSync(keywordsPath);
		} catch (error) {
			if (error.code === 'ENOENT') {
				throw new Error(`Keywords path does not exist: ${keywordsPath}`);
			}

			if (error.code === 'EACCES') {
				throw new Error(`Permission denied reading keywords path: ${keywordsPath}`);
			}

			throw error;
		}

		if (stats.isDirectory()) {
			try {
				keywords = fs.readdirSync(keywordsPath)
					.map(file => path.basename(file).split('.')[0])
					.filter(Boolean);

				if (keywords.length === 0) {
					throw new Error('The directory is empty: ' + keywordsPath);
				}
			} catch (error) {
				if (error.message.includes('empty')) {
					throw error;
				}

				throw new Error(`Failed to read directory: ${keywordsPath}. ${error.message}`);
			}
		} else if (stats.isFile()) {
			try {
				const fileContent = fs.readFileSync(keywordsPath, 'utf8');

				if (!fileContent || fileContent.trim().length === 0) {
					throw new Error('The file is empty: ' + keywordsPath);
				}

				keywords = parseKeywords(fileContent);

				if (keywords.length === 0 && !(keywords instanceof RegExp)) {
					throw new Error('The file is empty: ' + keywordsPath);
				}
			} catch (error) {
				if (error.message.includes('empty')) {
					throw error;
				}

				if (error.message.includes('Failed to parse keywords')) {
					throw error;
				}

				throw new Error(`Failed to read file: ${keywordsPath}. ${error.message}`);
			}
		} else {
			throw new Error(`Invalid keywords path: ${keywordsPath}`);
		}
	}

	// Normalize prefix
	prefix = prefix && typeof prefix === 'string' ? prefix : undefined;

	// Validate prefix if provided
	if (prefix !== undefined && prefix.length > 100) {
		throw new Error('Prefix is too long (max 100 characters)');
	}

	// Deduplicate keywords (but not for RegExp)
	if (!(keywords instanceof RegExp)) {
		keywords = [...new Set(keywords)];

		// Validate keyword count
		if (keywords.length > 1000) {
			throw new Error(`Too many keywords (${keywords.length}). Maximum is 1000.`);
		}
	}

	return {
		...inputs,
		keywords,
		prefix,
	};
}
