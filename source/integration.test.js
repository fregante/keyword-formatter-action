import {describe, it, expect} from 'vitest';
import {formatTitle} from './format-title.js';
import {processInputs} from './inputs.js';

describe('Integration Tests', () => {
	describe('Common use cases', () => {
		it('formats package names in monorepo', () => {
			const inputs = processInputs({
				keywords: 'package-a, package-b',
			});

			const title = formatTitle('Fix: package-a crashes on startup', inputs);
			expect(title).toBe('Fix: `package-a` crashes on startup');
		});

		it('formats multiple keywords in single title', () => {
			const inputs = processInputs({
				keywords: 'fix, feat, chore',
			});

			const title = formatTitle('fix: Update feat and chore documentation', inputs);
			expect(title).toBe('`fix`: Update `feat` and `chore` documentation');
		});

		it('handles ESLint rule names', () => {
			const inputs = processInputs({
				keywords: 'no-console, no-unused-vars',
				prefix: 'eslint/',
			});

			const title = formatTitle('Fix eslint/no-console warnings', inputs);
			expect(title).toBe('Fix `eslint/no-console` warnings');
		});

		it('preserves already formatted keywords', () => {
			const inputs = processInputs({
				keywords: 'keyword',
			});

			const title = formatTitle('Already has `keyword` formatted', inputs);
			expect(title).toBe('Already has `keyword` formatted');
		});

		it('handles case-insensitive matching', () => {
			const inputs = processInputs({
				keywords: 'api, ui, db',
			});

			const title = formatTitle('API and UI improvements for DB', inputs);
			expect(title).toBe('`API` and `UI` improvements for `DB`');
		});
	});

	describe('Edge cases', () => {
		it('handles very long keyword lists', () => {
			const keywords = Array.from({length: 100}, (_, i) => `keyword${i}`).join(',');
			const inputs = processInputs({keywords});

			const title = formatTitle('Fix keyword50 issue', inputs);
			expect(title).toBe('Fix `keyword50` issue');
		});

		it('handles hyphenated keywords correctly', () => {
			// Full hyphenated words match
			const inputs = processInputs({
				keywords: 'angular-core, vue-cli',
			});

			const title = formatTitle('Update angular-core and vue-cli', inputs);
			expect(title).toBe('Update `angular-core` and `vue-cli`');
		});

		it('handles keywords with numbers', () => {
			const inputs = processInputs({
				keywords: 'v1, v2, v3',
			});

			const title = formatTitle('Migrate from v1 to v2', inputs);
			expect(title).toBe('Migrate from `v1` to `v2`');
		});

		it('does not format partial word matches', () => {
			const inputs = processInputs({
				keywords: 'test',
			});

			const title = formatTitle('Latest testing updates', inputs);
			expect(title).toBe('Latest testing updates');
		});

		it('does not format hyphenated partial matches', () => {
			const inputs = processInputs({
				keywords: 'test',
			});

			const title = formatTitle('Update pre-test-runner', inputs);
			expect(title).toBe('Update pre-test-runner');
		});
	});

	describe('Real-world scenarios', () => {
		it('formats GitHub issue with error code', () => {
			const inputs = processInputs({
				keywords: 'ERR_CONNECTION_REFUSED, ECONNRESET',
			});

			const title = formatTitle('[Bug] ERR_CONNECTION_REFUSED when connecting', inputs);
			expect(title).toBe('[Bug] `ERR_CONNECTION_REFUSED` when connecting');
		});

		it('formats conventional commit types', () => {
			const inputs = processInputs({
				keywords: 'fix, feat, docs, style, refactor, test, chore',
			});

			const title = formatTitle('feat: Add new feature for docs', inputs);
			expect(title).toBe('`feat`: Add new feature for `docs`');
		});

		it('handles emoji in titles', () => {
			const inputs = processInputs({
				keywords: 'bug, feature',
			});

			const title = formatTitle('🐛 bug: Fix feature crash', inputs);
			expect(title).toBe('🐛 `bug`: Fix `feature` crash');
		});

		it('handles URLs in titles without breaking them', () => {
			const inputs = processInputs({
				keywords: 'docs',
			});

			const title = formatTitle('Update docs: see https://example.com/docs-page', inputs);
			// URL should not be broken by formatting
			expect(title).toBe('Update `docs`: see https://example.com/docs-page');
		});

		it('handles multiple prefixed keywords', () => {
			const inputs = processInputs({
				keywords: 'rule-a, rule-b, rule-c',
				prefix: 'plugin/',
			});

			const title = formatTitle('Fix plugin/rule-a and plugin/rule-b conflicts', inputs);
			expect(title).toBe('Fix `plugin/rule-a` and `plugin/rule-b` conflicts');
		});
	});

	describe('Performance scenarios', () => {
		it('handles titles with many potential matches', () => {
			const inputs = processInputs({
				keywords: 'a, b, c, d, e',
			});

			const title = 'a b c d e a b c d e'.repeat(5);
			const result = formatTitle(title, inputs);
			// Should complete without timeout
			expect(result).toBeTruthy();
		});

		it('handles empty title gracefully', () => {
			const inputs = processInputs({
				keywords: 'keyword',
			});

			const title = formatTitle('', inputs);
			expect(title).toBe('');
		});

		it('handles title with only spaces', () => {
			const inputs = processInputs({
				keywords: 'keyword',
			});

			const title = formatTitle('   ', inputs);
			expect(title).toBe('   ');
		});
	});

	describe('Regex pattern support', () => {
		it('formats keywords matching regex pattern', () => {
			const inputs = processInputs({
				keywords: '/fix|feat|chore/',
			});

			// Note: Regex matching in formatTitle would need to be implemented
			// This test documents expected behavior
			expect(inputs.keywords).toBeInstanceOf(RegExp);
		});

		it('validates safe regex patterns', () => {
			expect(() => processInputs({
				keywords: '/(a+)+/',
			})).toThrow('Potentially unsafe regex pattern');
		});
	});
});
