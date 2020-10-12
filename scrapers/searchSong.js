const simpleYT = require("simpleyt");

async function getUri (searchQuery) {
	/*Expecting searchQuery as a List !*/
	let results = {};
	await simpleYT(searchQuery.join(" ")).then((searchResult) => {
		results = {
			title: searchResult[0].title,
			uri: searchResult[0].uri,
		};
	});
	return results;
};

async function searchSong (searchQuery) {
	/*Expecting searchQuery as a List !*/
	let results = [];
	await simpleYT(searchQuery.join(" ")).then((searchResult) => {
		searchResult.forEach((element) => {
			results.push({
				title: element.title,
				uri: element.uri,
			});
		});
	});

	return results;
};

module.exports = { getUri, searchSong };
