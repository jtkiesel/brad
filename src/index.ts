import axios from 'axios';
import {Client, Constants, GuildMember, TextBasedChannel} from 'discord.js';
import {discordToken, robotEventsToken} from './config';

const client = new Client({
  intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES'],
});
const rulesChannelId = '291747463272988673';
const newMembersChannelId = '291772526604976128';

const roles = [
  'Science',
  'Technology',
  'Research',
  'Engineering',
  'Arts',
  'Math',
  'Spirit',
  'Opportunity',
  'Innovate',
  'Design',
  'Non-Competitor',
];
const divisions = new Map<string, string>();

const updateDivisions = async () => {
  const response = await axios.get<string>(
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSr3MtY9pUviYmZ5a9r8O1G0XydE5kHAPkN6OerGcI4oT5eO_nZgPbUD2t7feFEs2fhoOyKLtDYlacw/pub?gid=0&single=true&output=csv'
  );
  const teams = response.data.split('\r\n');
  for (const team of teams) {
    const [teamId, division] = team.split(',');
    divisions.set(teamId, division);
  }
};

const setDivision = async (member: GuildMember, nickname: string) => {
  if (!nickname || nickname.indexOf(' | ') === -1) {
    console.log(`Invalid nickname: "${nickname}"`);
    return;
  }
  const teamId = nickname.split(' | ')[1];
  const division = divisions.get(teamId) ?? 'Non-Competitor';
  console.log(teamId + ' | ' + division);
  const roleNames = roles.slice();
  roleNames.splice(roleNames.indexOf(division), 1);

  const removeRoles = [];
  for (const roleName of roleNames) {
    const role = member.guild.roles.cache.find(({name}) => name === roleName);
    if (role) {
      removeRoles.push(role);
    }
  }
  await member.roles.remove(removeRoles);
  const divisionRole = member.guild.roles.cache.find(
    ({name}) => name === division
  );
  if (divisionRole) {
    await member.roles.add(divisionRole);
  }
};

client.on(Constants.Events.CLIENT_READY, () => console.log('I am ready!'));

client.on(Constants.Events.ERROR, console.error);

client.on(Constants.Events.GUILD_MEMBER_ADD, member => {
  const newMembers = member.guild.channels.cache.get(
    newMembersChannelId
  ) as TextBasedChannel;
  newMembers.send(
    `Welcome, ${member}! To access this server, you must be verified.\nPlease take a moment to read our server <#${rulesChannelId}>, then send a message here with your name (or username) and team ID (such as "Kayley | 24B" or "Jordan | BNS"), and/or ask one of the <@&291768070811156481> for help.`
  );
});

client.on(Constants.Events.MESSAGE_CREATE, async message => {
  if (message.author === client.user) {
    return; // Ignore messages from the client itself.
  }
  if (message.member?.roles.cache.some(({name}) => name === 'admins')) {
    if (message.content === '!update') {
      console.log('Starting update.');
      await updateDivisions();
      const membersCollection = await message.guild?.members.fetch();
      if (!membersCollection) {
        return;
      }
      const members = Array.from(membersCollection.values());
      let i = 0;
      for (const member of members) {
        console.log(
          `Setting division for ${member} (${++i}/${members.length}).`
        );
        await setDivision(member, member.displayName);
      }
      console.log('DONE SETTING DIVISIONS.');
    }
  }
  if (message.channel.id === newMembersChannelId) {
    const nickname = message.content.split('|');

    if (nickname.length !== 2) {
      await message.reply(
        'Incorrect format. Separate name and team ID by a single "|" (example: **Jordan | 24C**).'
      );
      return;
    }
    const name = nickname[0].trim();
    const teamId = nickname[1].trim().toUpperCase();

    if (!/^([0-9]{1,5}[A-Z]?|[A-Z]{2,6}[0-9]{0,2})$/.test(teamId)) {
      await message.reply(
        'Please enter a valid team ID (example: **24B**, or **BNS2**).'
      );
      return;
    }
    const response = await axios.get<{meta: {total: number}}>(
      'https://www.robotevents.com/api/v2/teams?number[]=' + teamId,
      {headers: {Authorization: `Bearer ${robotEventsToken}`}}
    );

    if (response.data.meta.total === 0) {
      await message.reply('That team ID does not exist.');
      return;
    }
    const newNickname = name + ' | ' + teamId;
    if (!message.member) {
      return;
    }
    try {
      await message.member.setNickname(newNickname);
    } catch (error) {
      console.error(`Couldn't set nickname for ${message.member}`, error);
    }
    await setDivision(message.member, newNickname);
  }
});

updateDivisions().then(() => client.login(discordToken));
