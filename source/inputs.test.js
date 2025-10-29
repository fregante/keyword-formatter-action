import {mkdirSync} from 'node:fs';
import {describe, it, expect} from 'vitest';
import {processInputs, parseKeywords} from './inputs.js';

const filesystemKeywords = ['durian', 'marang', 'rambutan'];

describe('parseKeywords', () => {
	it('should parse comma-separated list', () => {
		const result = parseKeywords('fix, feat, bug');
		expect(result).toEqual(['fix', 'feat', 'bug']);
	});

	it('should parse newline-separated list', () => {
		const result = parseKeywords('fix\nfeat\nbug');
		expect(result).toEqual(['fix', 'feat', 'bug']);
	});

	it('should parse regular expression', () => {
		const result = parseKeywords('/^(fix|feat|bug)/');
		expect(result).toBeInstanceOf(RegExp);
		expect(result.source).toBe('^(fix|feat|bug)');
	});

	it('should handle mixed separators and whitespace', () => {
		const result = parseKeywords(' fix, feat\n bug , chore ');
		expect(result).toEqual(['fix', 'feat', 'bug', 'chore']);
	});

	it('should throw on empty regex pattern', () => {
		expect(() => parseKeywords('//')).toThrow('Regex pattern cannot be empty');
	});

	it('should throw on invalid regex pattern', () => {
		expect(() => parseKeywords('/[unclosed/')).toThrow('Invalid regex pattern');
	});

	it('should throw on potentially unsafe regex pattern with nested quantifiers', () => {
		expect(() => parseKeywords('/(a+)+/')).toThrow('Potentially unsafe regex pattern');
	});

	it('should throw on null or undefined keywords', () => {
		expect(() => parseKeywords(null)).toThrow('Keywords must be a non-empty string');
		expect(() => parseKeywords(undefined)).toThrow('Keywords must be a non-empty string');
	});

	it('should throw on non-string keywords', () => {
		expect(() => parseKeywords(123)).toThrow('Keywords must be a non-empty string');
	});
});

describe('processInputs', () => {
	it('parses a single keyword', () => {
		const result = processInputs({
			keywords: 'fix',
		});
		expect(result).toEqual({
			keywords: ['fix'],
		});
	});

	it('parses a comma-separed keywords', () => {
		const result = processInputs({
			keywords: 'fix, feat, bug',
		});
		expect(result).toEqual({
			keywords: ['fix', 'feat', 'bug'],
		});
	});

	it('parses a line-separed keywords', () => {
		const result = processInputs({
			keywords: 'fix\nfeat\nbug',
		});
		expect(result).toEqual({
			keywords: ['fix', 'feat', 'bug'],
		});
	});

	it('deduplicates keywords', () => {
		const result = processInputs({
			keywords: 'fix, fix, fix',
		});
		expect(result).toEqual({
			keywords: ['fix'],
		});
	});

	it('ignores empty keywords', () => {
		const result = processInputs({
			keywords: 'fix,, feat, bug',
		});
		expect(result).toEqual({
			keywords: ['fix', 'feat', 'bug'],
		});
	});

	it('loads a comma-separed keywordsPath', () => {
		const result = processInputs({
			keywordsPath: 'fixtures/comma.txt',
		});
		expect(result).toEqual({
			keywords: filesystemKeywords,
		});
	});

	it('loads a line-separed keywordsPath', () => {
		const result = processInputs({
			keywordsPath: 'fixtures/linebreak',
		});
		expect(result).toEqual({
			keywords: filesystemKeywords,
		});
	});

	it('loads a directory keywordsPath', () => {
		const result = processInputs({
			keywordsPath: 'fixtures/directory',
		});
		expect(result).toEqual({
			keywords: filesystemKeywords,
		});
	});

	it('accepts prefix', () => {
		const result = processInputs({
			prefix: 'cool-',
			keywords: 'fix',
		});
		expect(result).toEqual({
			keywords: ['fix'],
			prefix: 'cool-',
		});
	});

	it('discards empty or false prefix', () => {
		const vFalse = processInputs({
			prefix: false,
			keywords: 'fix',
		});
		expect(vFalse).toEqual({
			keywords: ['fix'],
		});

		const vEmpty = processInputs({
			prefix: '',
			keywords: 'fix',
		});
		expect(vEmpty).toEqual({
			keywords: ['fix'],
		});

		const vUndefined = processInputs({
			prefix: undefined,
			keywords: 'fix',
		});
		expect(vUndefined).toEqual({
			keywords: ['fix'],
		});
	});

	it('accepts dryRun', () => {
		const result = processInputs({
			keywords: 'fix',
			dryRun: true,
		});
		expect(result).toEqual({
			keywords: ['fix'],
			dryRun: true,
		});
	});

	it('throws when keywordsPath doesn\'t exist', () => {
		expect(() => processInputs({
			keywordsPath: 'fixtures/doesnotexist',
		})).toThrow('Keywords path does not exist');
	});

	it('throws when keywordsPath is an empty file', () => {
		expect(() => processInputs({
			keywordsPath: 'fixtures/empty-file',
		})).toThrow('The file is empty: fixtures/empty-file');
	});

	it('throws when keywordsPath is an empty directory', () => {
		mkdirSync('fixtures/empty-directory', {recursive: true});
		expect(() => processInputs({
			keywordsPath: 'fixtures/empty-directory',
		})).toThrow('The directory is empty: fixtures/empty-directory');
	});

	it('throws when prefix is too long', () => {
		expect(() => processInputs({
			keywords: 'fix',
			prefix: 'a'.repeat(101),
		})).toThrow('Prefix is too long');
	});

	it('throws when there are too many keywords', () => {
		const tooManyKeywords = Array.from({length: 1001}, (_, i) => `keyword${i}`).join(',');
		expect(() => processInputs({
			keywords: tooManyKeywords,
		})).toThrow('Too many keywords');
	});

	it('handles regex keywords without throwing on deduplication', () => {
		const result = processInputs({
			keywords: '/fix|feat/',
		});
		expect(result.keywords).toBeInstanceOf(RegExp);
	});

	it('wraps parse errors with context', () => {
		expect(() => processInputs({
			keywords: '/[invalid/',
		})).toThrow('Failed to parse keywords');
	});
});
