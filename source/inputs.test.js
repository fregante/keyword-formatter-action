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
		})).toThrow('ENOENT: no such file or directory, stat \'fixtures/doesnotexist\'');
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
});
