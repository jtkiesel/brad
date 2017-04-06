const Discord = require('discord.js');
const client = new Discord.Client();

//const request = require('request');
const fs = require('fs');

var roleIds = {'Science': '298695769848938496', 'Technology': '298696545249918976', 'Research': '298696653937049600', 'Engineering': '298696666536607745', 'Arts': '298696704419430402', 'Math': '298696720538402816', 'Spirit': '298696736652656640', 'Opportunity': '298696748111757326', 'Design': '298696794056032257', 'Innovate': '298696806806716418', 'Non-Competitor': '298700344110612480'};
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
console.log('teamId: ' + teamId);
console.log('division: ' + division;
	member.removeRoles(Object.values(roleIds));
console.log('member.roles: ' + Object.keys(member.roles));
	if (division in ['Science', 'Technology', 'Research', 'Engineering', 'Arts', 'Math', 'Spirit', 'Opportunity', 'Design', 'Innovate']) {
		member.addRole(member.guild.roles.find({name: division}));
	} else {
		member.addRole(member.guild.roles.find({name: 'Non-Competitor'}));
	}
console.log('member.roles: ' + Object.keys(member.roles));
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
console.log('hello');
			if (/^([0-9]{1,5}[A-Z]?|[A-Z]{2,6}[0-9]{0,2})$/.test(teamId)) {
				var member = message.member;
console.log('o shit');
				member.setNickname(name + ' | ' + teamId);
console.log('nickname: ' + member.nickname');
				setRole(member);
			}
		}
	}
});

client.login('Bot Mjk5MjczNjQ1MjE2MzY2NTky.C8bf0A.2xG6kiAxG569srFSvWqKQBhQHIM');
