import {describe, it, expect} from 'vitest';
import {formatTitle} from './format-title.js';

describe('formatTitle', () => {
	it('formats a simple keyword', () => {
		const result = formatTitle('hello world', {
			keywords: ['hello'],
		});
		expect(result).toBe('`hello` world');
	});

	it('handles multiple keywords', () => {
		const result = formatTitle('`hello` world, `goodbye` moon', {
			keywords: ['hello', 'goodbye'],
		});
		expect(result).toBe('`hello` world, `goodbye` moon');
	});

	it('ignores partial matches', () => {
		const result = formatTitle('hello world', {
			keywords: ['hell'],
		});
		expect(result).toBe('hello world');
	});

	it('ignores partial matches with dashes', () => {
		const result = formatTitle('hello-world', {
			keywords: ['hello'],
		});
		expect(result).toBe('hello-world');
	});

	it('preserves quotes around keywords', () => {
		const result = formatTitle('"hello" world', {
			keywords: ['hello', 'world'],
		});
		expect(result).toBe('"`hello`" `world`');
	});

	it('preserves colons following keywords', () => {
		const result = formatTitle('hello: world', {
			keywords: ['hello'],
		});
		expect(result).toBe('`hello`: world');
	});

	it('preserves single quotes following keywords', () => {
		const result = formatTitle('dude\'s world', {
			keywords: ['dude'],
		});
		expect(result).toBe('`dude`\'s world');
	});

	it('preserves whitespace', () => {
		const result = formatTitle('  hello   world  ', {
			keywords: ['hello', 'world'],
		});
		expect(result).toBe('  `hello`   `world`  ');
	});

	it('handles empty keywords', () => {
		const result = formatTitle('hello world', {
			keywords: [],
		});
		expect(result).toBe('hello world');
	});

	it('is case insensitive for keyword keywords and preserves the case', () => {
		const result = formatTitle('HELLO world', {
			keywords: ['hello'],
		});
		expect(result).toBe('`HELLO` world');
	});

	it('includes existing prefix in the formatted keyword', () => {
		const result = formatTitle('unicorn/hello world', {
			keywords: ['hello', 'world'],
			prefix: 'unicorn/',
		});
		expect(result).toBe('`unicorn/hello` `world`');
	});

	it('should not format keywords twice', () => {
		const result = formatTitle('`hello`', {
			keywords: ['hello'],
		});
		expect(result).toBe('`hello`');
	});

	it('should not wrap format twice even if the the word is part of a larger formatted string', () => {
		const result = formatTitle('You had me `at hello`', {
			keywords: ['hello'],
		});
		expect(result).toBe('You had me `at hello`');
	});

	// TODO: https://github.com/fregante/keyword-formatter-action/issues/1
	it.fails('should not wrap format twice even if the the word is in the middle of formatted string', () => {
		const result = formatTitle('You had `me at hello`', {
			keywords: ['at'],
		});
		expect(result).toBe('You had `me at hello`');
	});
});
