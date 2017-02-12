const axios = require("axios");
const concat = require("concat-stream");
const FormData = require("form-data");
const fs = require("fs");

const ENDPOINT_GET_KEY = "https://api.gfycat.com/v1/gfycats";
const ENDPOINT_UPLOAD = "https://filedrop.gfycat.com";
const ENDPOINT_GET_STATUS = "https://api.gfycat.com/v1/gfycats/fetch/status";

module.exports = function(file, options) {
	let gfyname;
	
	const data = {};
	if (options.title) data.title = options.title;
	if (options.desc) data.description = options.desc;
	if (options.tags) data.tags = options.tags;
	if (options.private) data.private = options.private;
	if (options.nsfw) data.nsfw = options.nsfw;
	if (options.cut) data.cut = options.cut;
	if (options.crop) data.crop = options.crop;

	console.log(data);

	if (options.verbose) console.log(`Getting gfy name from ${ENDPOINT_GET_KEY}`);
	return axios.post(ENDPOINT_GET_KEY, { data: data, headers: {"Content-Type": "application/json"} })
		.then((res) => {;
			gfyname = res.data.gfyname;
			if (options.verbose) {
				console.log("Successfully got gfy name");
				console.log(`Gfy name: ${gfyname}`);
				console.log("Generating form data...");
			}
			const fd = new FormData();
			fd.append("key", gfyname);
			fd.append("file", fs.createReadStream(file));
			return pipeConcat(fd, { encoding: "buffer" });
		})
		.then((it) => {
			if (options.verbose) {
				console.log("Generated form data");
				console.log("Uploading file...");
			}
			return axios.post(ENDPOINT_UPLOAD, it.data, {
				headers: it.headers
			});
		})
		.then(() => {
			if (options.verbose) {
				console.log("Uploaded file");
			}
			return process(gfyname, options.verbose);
		})
		.then((name) => {
			if (options.verbose) {
				console.log("Gfy processed");
				console.log(`Public name: ${name}`);
			}
			return `https://gfycat.com/${name}`;
		})
		.catch((e) => {
			console.error(e);
		});
};

function pipeConcat(fd, it) {
	return new Promise((resolve, reject) => {
		fd.pipe(concat(it, (data) => {
			resolve({
				data: data,
				headers: fd.getHeaders()
			});
		}));
	});
}

function unlink(path) {
	return new Promise((resolve, reject) => {
		fs.unlink(path, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
}

function process(gfyname, verbose) {
	return new Promise((resolve, reject) => {
		function check() {
			axios.get(`${ENDPOINT_GET_STATUS}/${gfyname}`)
				.then((res) => {
					if (res.data.task == "complete") {
						resolve(res.data.gfyName || res.data.gfyname);
					} else {
						if (verbose) {
							console.log("Waiting for Gfy to be processed...");
						}
						setTimeout(check, 2000);
					}
				}).catch(reject);
		}

		check();
	});
}
