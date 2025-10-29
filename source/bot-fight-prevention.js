import fs from 'node:fs';
import path from 'node:path';
import * as cache from '@actions/cache';
import {info, warning} from '@actions/core';

/**
 * Gets cache data for a specific issue/PR
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} number - Issue/PR number
 * @returns {Promise<{doNotTouch: boolean, lastBotTitle: string|null}>}
 */
export async function getCacheData(owner, repo, number) {
	const cacheKey = `keyword-formatter-${owner}-${repo}-${number}`;
	const cachePaths = ['/tmp/keyword-formatter-cache'];

	try {
		const restoredKey = await cache.restoreCache(cachePaths, cacheKey);
		if (!restoredKey) {
			return {doNotTouch: false, lastBotTitle: null};
		}

		const cacheFile = cachePaths[0];
		if (fs.existsSync(cacheFile)) {
			const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
			return {
				doNotTouch: data.doNotTouch ?? false,
				lastBotTitle: data.lastBotTitle ?? null,
			};
		}
	} catch (error) {
		// Cache errors should not fail the action
		warning(`Failed to restore cache: ${error.message}`);
	}

	return {doNotTouch: false, lastBotTitle: null};
}

/**
 * Saves cache data for a specific issue/PR
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} number - Issue/PR number
 * @param {object} data - Data to save
 */
export async function saveCacheData(owner, repo, number, data) {
	const cacheKey = `keyword-formatter-${owner}-${repo}-${number}`;
	const cachePaths = ['/tmp/keyword-formatter-cache'];

	try {
		const cacheFile = cachePaths[0];

		// Ensure directory exists
		const directory = path.dirname(cacheFile);
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, {recursive: true});
		}

		fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8');
		await cache.saveCache(cachePaths, cacheKey);
		info(`Cache saved for ${owner}/${repo}#${number}`);
	} catch (error) {
		// Cache errors should not fail the action
		warning(`Failed to save cache: ${error.message}`);
	}
}

/**
 * Checks if the user has undone a bot change
 * @param {string} currentTitle - Current title
 * @param {string} lastBotTitle - Last title the bot set
 * @param {string} formattedTitle - What the title would be if formatted
 * @returns {boolean}
 */
export function didUserUndoBotChange(currentTitle, lastBotTitle, formattedTitle) {
	// If we never touched it, user couldn't have undone our change
	if (!lastBotTitle) {
		return false;
	}

	// If current title matches what the bot last set, no undo happened
	if (currentTitle === lastBotTitle) {
		return false;
	}

	// User changed the title from what the bot set
	// Check if formatting the current title would produce what the bot had set
	// This means the user reverted the formatting
	return formattedTitle === lastBotTitle;
}
