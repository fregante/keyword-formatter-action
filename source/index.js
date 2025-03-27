import fs from 'node:fs';
import process from 'node:process';
import {
	endGroup,
	info,
	setOutput,
	startGroup,
} from '@actions/core';
import {Octokit} from '@octokit/action';
import {formatTitle} from './format-title.js';
import {getInputs, processInputs} from './inputs.js';

const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH));

const octokit = new Octokit();

async function getCurrentTitle({owner, repo, number}) {
	// Read the title from via API to support multiple actions in a row making changes to the title
	const {data} = await octokit.rest.issues.get({
		owner, repo, issue_number: number,
	});

	return data.title;
}

function readEnv() {
	if (!['issues', 'pull_request', 'pull_request_target'].includes(process.env.GITHUB_EVENT_NAME)) {
		throw new Error('Only `issues`, `pull_request`, and `pull_request_target` events are supported. Received: ' + process.env.GITHUB_EVENT_NAME);
	}

	if (!['opened', 'edited'].includes(event.action)) {
		throw new Error(`Only types \`opened\` and \`edited\` events are supported. Received: ${process.env.GITHUB_EVENT_NAME}.${event.action}`);
	}

	const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
	const {number} = event.issue ?? event.pull_request;

	return {
		owner,
		repo,
		number,
	};
}

async function run() {
	const {owner, repo, number} = readEnv();
	const title = await getCurrentTitle({owner, repo, number});
	startGroup('Environment');
	info(JSON.stringify({
		owner, repo, number, title,
	}, null, 2));
	endGroup();

	const inputs = getInputs();
	const processedInputs = processInputs(inputs);
	startGroup('Inputs');
	info(JSON.stringify({inputs, processedInputs}, null, 2));
	endGroup();

	const newTitle = formatTitle(title, processedInputs);
	const changeNeeded = title !== newTitle;
	setOutput('title', newTitle);
	setOutput('changed', changeNeeded);

	info(`Title: "${newTitle}"`);

	if (title === newTitle) {
		info('No title changes needed');
		return;
	}

	info(`New title: "${newTitle}"`);

	if (inputs.dryRun) {
		info('Dry run: No changes applied');
		return;
	}

	await octokit.issues.update({
		owner, repo, issue_number: number, title: newTitle,
	});

	info('Title updated successfully');
}

// eslint-disable-next-line unicorn/prefer-top-level-await
run();
