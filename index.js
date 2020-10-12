const Discord = require("discord.js");
const dotenv = require("dotenv");
const ytdl = require("ytdl-core");
const scraper = require("./scrapers/searchSong");

const client = new Discord.Client();

client.on("ready", () => {
	console.log("Connected to Guilds !");
});

const PREFIX = ";";
const servers = {};

client.on("message", async (message) => {
	/* Verifying some things ! */

	if (!message.content.startsWith(PREFIX)) return;

	if (!message.guild) {
		if (message.author.bot) return;
		message.author.send(
			"Use ```" + PREFIX + "help``` in Guild/Server to get help !"
		);
		return;
	}

	if (message.author.bot) return;

	if (!message.member.voice.channel) {
		message.channel.send(
			"**You need to be in a Voice channel to Execute any Command !**"
		);
		return;
	}

	let permission = message.member.voice.channel.permissionsFor(
		message.client.user
	);

	if (!permission.has("CONNECT") || !permission.has("SPEAK")) {
		message.channel.send(
			"**I Don't Have permission to Join or Speak in that Channel !**"
		);
		return;
	}

	if (!servers[message.guild.id])
		servers[message.guild.id] = {
			queue: [],
			playing: false,
			loopqueue: false,
		};

	server = servers[message.guild.id];

	let args = message.content.substr(PREFIX.length).split(" ");
	let command = args[0];
	args.shift();

	switch (command.toLowerCase()) {
		case "p":
		case "play":
			if (server.paused) {
				server.dispatcher.resume();
				server.paused = false;
				break;
			}

			if (!args[0]) {
				message.channel.send("No Parameter Provided !");
				break;
			}

			if (args[0].startsWith("https://www.youtube.com/")) {
				server.queue.push({ title: args[0], uri: args[0] });
				beforePlay(server, message, { title: args[0], uri: args[0] });
			} else {
				scraper.getUri(args).then((result) => {
					server.queue.push({ title: result.title, uri: result.uri });
					beforePlay(server, message, result);
				});
			}
			break;

		case "s":
		case "skip":
			if (!server.playing) {
				message.channel.send("No Song is Currently Playing !");
			} else {
				message.channel.send("**Skipped !**");
				message.member.voice.channel.join().then((connection) => {
					skip(server, connection);
				});
			}
			break;

		case "pause":
			server.dispatcher.pause();
			server.paused = true;
			message.channel.send("**Paused !**");
			break;

		case "q":
		case "queue":
			let messageToSend = "";
			if (!server.queue[0]) {
				message.channel.send("**Nothing to Show in Queue !**");
				break;
			}

			let count = 1;
			server.queue.forEach((element) => {
				messageToSend += count + ". " + element.title + "\n";
				count += 1;
			});
			message.channel.send("```" + messageToSend + "```");
			break;

		case "loopqueue":
		case "lq":
			server.loopqueue = !server.loopqueue;
			if (server.loopqueue) message.channel.send("Queue Loop Enabled !");
			else message.channel.send("Queue Loop Disabled !");
			break;

		case "clear":
		case "c":
			// Clearing Queue !
           	while (server.queue.length > 1)
				server.queue.pop();
			message.channel.send("Cleared !");
			break;

		case "r":
		case "remove":
			if(args[0] != 1) {
				server.queue.splice(args[0]-1,1);
				message.channel.send("Removed !")
			}
			break;
	}
});

dotenv.config();
client.login(process.env.DISCORD_PLAY_IT);

function beforePlay(server, message, result) {
	if (server.playing)
		message.channel.send("Added **" + result.title + "** to Queue !");
	else {
		message.channel.send("Playing **" + result.title + "**");
		message.member.voice.channel.join().then((connection) => {
			playSong(server, connection);
		});
	}
}

function playSong(server, connection) {
	if (!server.queue[0]) {
		server.playing = false;
		connection.disconnect();
		return;
	}
	server.dispatcher = connection.play(
		ytdl(server.queue[0].uri, { filter: "audioonly" })
	);
	server.playing = true;
	server.dispatcher.on("finish", () => {
		if (server.loopqueue) server.queue.push(server.queue.shift());
		else server.queue.shift();
		if (server.queue[0]) {
			playSong(server, connection);
		} else {
			server.playing = false;
			connection.disconnect();
		}
	});
}

function skip(server, connection) {
	if (server.loopqueue) server.queue.push(server.queue.shift());
	else server.queue.shift();
	playSong(server, connection);
}
