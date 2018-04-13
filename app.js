const Discord = require('discord.js');
const request = require('request');

const client = new Discord.Client();
const token = process.env.BRAD_TOKEN;

const roles = ['Science', 'Technology', 'Research', 'Engineering', 'Arts', 'Math', 'Spirit', 'Opportunity', 'Innovate', 'Design', 'Non-Competitor'];
let divisions = {};

const updateDivisions = callback => {
	request('https://docs.google.com/spreadsheets/d/e/2PACX-1vT7oa4nLw7lWFOXAI2nJoT2wXqGihFINeeqWcDlcWHu3nYo4gYph5LFXYRwfU1sfNbmKyf_9td8aq7S/pub?gid=0&single=true&output=csv', (error, response, body) => {
		let teams = body.split('\r\n');
		for (let team of teams) {
			let [teamId, division] = team.split(',');
			divisions[teamId] = division;
			console.log(divisions[teamId]);
		}
		callback();
	});
}

const setDivision = async (member, nickname) => {
	if (!nickname || nickname.indexOf(' | ') === -1) {
		console.log('Invalid nickname.');
		return;
	}
	let teamId = nickname.split(' | ')[1];
	let division = divisions[teamId];

	if (roles.indexOf(division) === -1) {
		division = 'Non-Competitor';
	}
	console.log(teamId + ' | ' + division);
	let roleNames = roles.slice();
	roleNames.splice(roleNames.indexOf(division), 1);

	let removeRoles = [];
	for (let role of roleNames) {
		removeRoles.push(member.guild.roles.find('name', role));
	}
	await member.removeRoles(removeRoles);
	await member.addRole(member.guild.roles.find('name', division));
}

client.on('ready', () => {
	console.log('I am ready!');
});

client.on('error', console.error);

client.on('guildMemberAdd', member => {
	member.guild.channels.find('name', 'new-members').send(`Welcome, ${member}! To access this server, you must be verified.\nPlease take a moment to read our server <#291747463272988673>, then send a message here with your name (or username) and team ID (such as "Kayley | 24B" or "Jordan | BNS"), and/or ask one of the <@&291768070811156481> for help.`);
});

client.on('message', message => {
	if (message.author === client.user) {
		// Ignore messages from the client itself.
	} else if (message.member.roles.exists('name', 'admins')) {
		if (message.content === '!update') {
			console.log('Starting update.');
			updateDivisions(async () => {
				let members = Array.from(message.guild.members.values());
				let i = 0;
				for (let member of members) {
					console.log(`Setting division for ${member} (${++i}/${members.length}).`);
					await setDivision(member, member.displayName);
				}
				console.log('DONE SETTING DIVISIONS.');
			});
		}
	} else if (message.channel.name === 'new-members') {
		let nickname = message.content.split('|');

		if (nickname.length == 2) {
			let name = nickname[0].trim();
			let teamId = nickname[1].trim().toUpperCase();

			if (/^([0-9]{1,5}[A-Z]?|[A-Z]{2,6}[0-9]{0,2})$/.test(teamId)) {
				request('https://api.vexdb.io/v1/get_teams?team=' + teamId, async (error, response, body) => {
					body = JSON.parse(body);

					if (body.status == 1) {
						if (body.size > 0) {
							nickname = name + ' | ' + teamId;
							message.member.setNickname(nickname);
							await setDivision(message.member, nickname, () => {});
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

updateDivisions(() => {});

client.login(token);
