const Discord = require('discord.js');
const client = new Discord.Client();

const http = require('http');
const fs = require('fs');
const request = require('request');

var roles = ['Science', 'Technology', 'Research', 'Engineering', 'Arts', 'Math', 'Spirit', 'Opportunity', 'Design', 'Innovate', 'Non-Competitor'];
var divisions = {};
var divisionsFile = __dirname + '/divisions.csv';

function updateDivisions() {
	fs.readFile(divisionsFile, 'utf8', (err, data) => {
		if (err) {
			throw err;
		}
		var teams = data.split('\r\n');

		for (var team of teams) {
			var [teamId, division] = team.split(',');
			divisions[teamId] = division;
		}
	});
}

function removeRoles(member, roleNames) {
	if (roleNames.length > 0) {
		member.removeRole(member.guild.roles.find('name', roleNames.shift())).then(() => {
			removeRoles(member, roleNames);
		}).catch(console.log);
	}
}

function setDivision(member, nickname) {
	var teamId = nickname.split(' | ')[1];
	var division = divisions[teamId];

	if (roles.indexOf(division) === -1) {
		division = 'Non-Competitor';
	}
/*	var roleNames = roles.slice();
	roleNames.splice(roleNames.indexOf(division), 1);
	removeRoles(member, roleNames);
	member.addRole(member.guild.roles.find('name', division));*/
	member.removeRole(member.guild.roles.find('name', 'Science')).then(() => {
		member.removeRole(member.guild.roles.find('name', 'Technology')).then(() => {
			member.removeRole(member.guild.roles.find('name', 'Research')).then(() => {
				member.removeRole(member.guild.roles.find('name', 'Engineering')).then(() => {
					member.removeRole(member.guild.roles.find('name', 'Arts')).then(() => {
						member.removeRole(member.guild.roles.find('name', 'Math')).then(() => {
							member.removeRole(member.guild.roles.find('name', 'Spirit')).then(() => {
								member.removeRole(member.guild.roles.find('name', 'Opportunity')).then(() => {
									member.removeRole(member.guild.roles.find('name', 'Design')).then(() => {
										member.removeRole(member.guild.roles.find('name', 'Innovate')).then(() => {
											member.removeRole(member.guild.roles.find('name', 'Non-Competitor')).then(() => {
												member.addRole(member.guild.roles.find('name', division));
											}).catch(console.log);
										}).catch(console.log);
									}).catch(console.log);
								}).catch(console.log);
							}).catch(console.log);
						}).catch(console.log);
					}).catch(console.log);
				}).catch(console.log);
			}).catch(console.log);
		}).catch(console.log);
	}).catch(console.log);
}

client.on('ready', () => {
	console.log('I am ready!');
});

client.on('message', message => {
	if (message.author === client.user) {
		// Ignore messages from the client itself.
	} else if (message.member.roles.exists('name', 'admins')) {
		if (message.content === '!update') {
/*			var file = fs.createWriteStream(divisionsFile);
			http.get('http://docs.google.com/spreadsheets/d/1I3FHUlRP5DOs6hivntTWvBJWw0FAYTgpuR40yJfaRv0/pub?gid=1642287782&amp;single=true&amp;output=csv', (response) => {
				response.pipe(file);
				file.on('finish', () => {
					updateDivisions();
*/
					for (var member of message.guild.members.values()) {
						var nickname = member.nickname;
						if (nickname) {
							setDivision(member, member.nickname);
						}
					}
/*				});
			}).on('error', (error) => {
				fs.unlink(divisionsFile);
			});*/
		}
	} else if (message.channel.name === 'verify') {
		var nickname = message.content.split('|');

		if (nickname.length == 2) {
			var name = nickname[0].trim();
			var teamId = nickname[1].trim().toUpperCase();

			if (/^([0-9]{1,5}[A-Z]?|[A-Z]{2,6}[0-9]{0,2})$/.test(teamId)) {
				request('https://api.vexdb.io/v1/get_teams?apike=shNhxcphXlIXQVE2Npeu&team=' + teamId, (error, response, body) => {
					body = JSON.parse(body);

					if (body.status == 1) {
						if (body.size > 0) {
							nickname = name + ' | ' + teamId;
							message.member.setNickname(nickname);
							setDivision(message.member, nickname);
						} else {
							message.reply('That team ID does not exist.');
						}
					} else {
						message.reply('Sorry, VexDB messed up (Nathan pls).');
					}
				});
			} else {
				message.reply('Please enter a valid team ID (example: **24B**, or **BNS2**).');
			}
		} else {
			message.reply('Incorrect format. Separate name and team ID by a single "|" (example: **Jordan | 24C**).');
		}
	}
});

updateDivisions();

client.login('Bot Mjk5MjczNjQ1MjE2MzY2NTky.C8bf0A.2xG6kiAxG569srFSvWqKQBhQHIM');
