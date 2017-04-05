const Discord = require('discord.js');
const client = new Discord.Client();

const request = require('request');
const fs = require('fs');

var divisions = {};

fs.readFile(__dirname + '/divisions.csv', 'utf8', (err, data) => {
	if (err) {
		throw err;
	}
	var teams = data.split('\r\n');

	for (var i = 0; i < teams.length; i++) {
		var team = teams[i].split(',');
		var teamId = team[0];
		var division = team[1];
		divisions[teamId] = division;
	}
});

function setRole(member) {
	var teamId = member.nickname.split(' | ')[1];
	var division = divisions[teamId];
}

client.on('ready', () => {
	console.log('I am ready!');
});

client.on('message', message => {
	if (message.channel.name === 'verify') {
		var nickname = message.content.replace(/\s+/g, '').split('|');

		if (nickname.length == 2) {
			var name = nickname[0];
			var teamId = nickname[1].toUpperCase();

			if (/^([0-9]{1,5}[A-Z]?|[A-Z]{2,6}[0-9]{0,2})$/.test(teamId)) {
				var member = message.member;

				member.setNickname(name + ' | ' + teamId);

				setRole(member);
			}
		}
	}
});

client.login('Bot Mjk5MjczNjQ1MjE2MzY2NTky.C8bf0A.2xG6kiAxG569srFSvWqKQBhQHIM');
