import {describe, it, expect} from 'vitest';
import {didUserUndoBotChange} from './bot-fight-prevention.js';

describe('didUserUndoBotChange', () => {
	it('returns false when bot never touched the title', () => {
		const result = didUserUndoBotChange(
			'hello world',
			null,
			'`hello` world',
		);
		expect(result).toBe(false);
	});

	it('returns false when current title matches what bot last set', () => {
		const result = didUserUndoBotChange(
			'`hello` world',
			'`hello` world',
			'`hello` world',
		);
		expect(result).toBe(false);
	});

	it('returns true when user reverted bot formatting', () => {
		// Bot had set: "`hello` world"
		// User changed it to: "hello world"
		// Formatting "hello world" would produce "`hello` world"
		// This means user undid the bot's change
		const result = didUserUndoBotChange(
			'hello world',
			'`hello` world',
			'`hello` world',
		);
		expect(result).toBe(true);
	});

	it('returns false when user made a different change', () => {
		// Bot had set: "`hello` world"
		// User changed it to: "goodbye world"
		// Formatting "goodbye world" would produce "`goodbye` world"
		// This is a different change, not an undo
		const result = didUserUndoBotChange(
			'goodbye world',
			'`hello` world',
			'`goodbye` world',
		);
		expect(result).toBe(false);
	});

	it('returns true when user undid bot change and added new content', () => {
		// Bot had set: "`fix` the bug"
		// User changed it to: "fix the bug and add feature"
		// Formatting would produce "`fix` the bug and `add` `feature`"
		// The formatted version would not match what bot set
		const result = didUserUndoBotChange(
			'fix the bug and add feature',
			'`fix` the bug',
			'`fix` the bug and add feature',
		);
		expect(result).toBe(false);
	});

	it('returns true when user removed backticks from multiple keywords', () => {
		// Bot had set: "`hello` `world`"
		// User changed it to: "hello world"
		// Formatting would produce "`hello` `world`"
		const result = didUserUndoBotChange(
			'hello world',
			'`hello` `world`',
			'`hello` `world`',
		);
		expect(result).toBe(true);
	});
});
