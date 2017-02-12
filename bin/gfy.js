#! /usr/bin/env node

const logUpdate = require("log-update");
const program = require("commander");
const path = require("path");
const gfy = require("../");

program
	.version("1.0.0")
	.usage("[options] <file>")
	.option("-t, --title [title]", "Title for the Gfy")
	.option("-d --desc [desc]", "Description for the Gfy")
	.option("-T --tags [tags]", "Comma-separated list of the tags for the Gfy", (s) => s.split(","))
	.option("-p --private", "If the Gfy should be private (not published)")
	.option("-n --nsfw", "The NSFW status of the Gfy. 0 == clean, 1 == adult, 3 == possibly offensive")
	.option("-c --cut [cut]", "The section of the video to use. s:e where s and e are the number of seconds into the video to start/end from)", (s) => {
		const bits = s.split(":");
		const start = parseFloat(bits[0]);
		return { start: start, duration: parseFloat(bits[1]) - start };
	})
	.option("-C --crop [crop]", "The section of the video to crop. x,y:w,h where x,y is the upper left corner coordinate and w,h is the width/height to crop to", (s) => {
		const bits = s.split(":");
		const cornerBits = bits[0].split(",");
		const dimensionBits = bits[1].split(",");
		return {
			x: parseInt(cornerBits[0]),
			y: parseInt(cornerBits[1]),
			w: parseInt(dimensionBits[0]),
			h: parseInt(dimensionBits[1])
		};
	})
	.option("-v --verbose", "Verbose logging")
	.parse(process.argv);

if (!program.args.length) {
	program.help();
} else {
	// source: https://github.com/sindresorhus/cli-spinners
	const spinners = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
	let i = 0;
	let id;
	if (!program.verbose) {
		id = setInterval(() => {
			logUpdate(spinners[++i % spinners.length] + " Publishing Gfy")
		}, 80);
	}

	gfy(path.resolve(program.args[0]), program).then((url) => {
		if (!program.verbose) clearInterval(id);
		console.log(`Gfy published to ${url}`);
	});
}