import {SapphireClient} from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import axios from 'axios';
import {GatewayIntentBits, type GuildMember} from 'discord.js';
import {logLevel, robotEventsToken} from './lib/config';

export const serverId = '291747463272988673';
export const adminRoleId = '291768070811156481';
export const rulesChannelId = '291747463272988673';
export const newMembersChannelId = '291772526604976128';

const discordClient = new SapphireClient({
  shards: 'auto',
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  logger: {level: logLevel},
});

const programs = [
  {
    name: 'VRC HS',
    eventId: 49725,
    divisions: [
      'Science',
      'Technology',
      'Engineering',
      'Math',
      'Arts',
      'Opportunity',
      'Innovate',
      'Research',
      'Spirit',
      'Design',
    ],
  },
  {
    name: 'VRC MS',
    eventId: 49726,
    divisions: [
      'Science',
      'Technology',
      'Engineering',
      'Math',
      'Arts',
      'Opportunity',
    ],
  },
  {
    name: 'VEX U',
    eventId: 49727,
    divisions: ['Research', 'Design'],
  },
  {
    name: 'JROTC',
    eventId: 49728,
    divisions: ['Innovate', 'Spirit'],
  },
  {
    name: 'VIQC MS',
    eventId: 49729,
    divisions: [
      'Science',
      'Technology',
      'Engineering',
      'Math',
      'Arts',
      'Opportunity',
      'Innovate',
      'Research',
      'Spirit',
      'Design',
    ],
  },
  {
    name: 'VIQC ES',
    eventId: 49730,
    divisions: [
      'Science',
      'Technology',
      'Engineering',
      'Math',
      'Arts',
      'Opportunity',
      'Innovate',
      'Research',
      'Spirit',
      'Design',
    ],
  },
];
const programsByTeam = new Map<string, string>();
const divisionsByTeam = new Map<string, string>();

export const updateDivisions = async () => {
  const events = await Promise.all(
    programs.map(async ({name, eventId, divisions}) => {
      const teams: string[] = [];
      let page = 0;
      let lastPage: number;
      do {
        const {
          data: {meta, data},
        } = await axios.get<{
          meta: {last_page: number};
          data: {number: string}[];
        }>(
          `https://www.robotevents.com/api/v2/events/${eventId}/teams?per_page=250&page=${++page}`,
          {headers: {Authorization: `Bearer ${robotEventsToken}`}}
        );
        data.forEach(({number}) => teams.push(number));
        lastPage = meta.last_page;
      } while (page < lastPage);
      return {name, divisions, teams};
    })
  );
  programsByTeam.clear();
  divisionsByTeam.clear();
  events.forEach(({name, divisions, teams}) =>
    teams.forEach((team, index) => {
      if (!programsByTeam.has(team)) {
        programsByTeam.set(team, name);
      }
      if (!divisionsByTeam.has(team)) {
        divisionsByTeam.set(team, divisions[index % divisions.length]);
      }
    })
  );
};

export const updateRoles = async () => {
  const guild = await discordClient.guilds.fetch(serverId);
  const members = await guild.members.fetch();
  const manageableMembers = Array.from(
    members.filter(member => member.manageable).values()
  );
  await Promise.all(manageableMembers.map(member => setRoles(member)));
  discordClient.logger.info('DONE UPDATING ROLES');
};

export const setRoles = async (member: GuildMember) => {
  const nickname = member.displayName;
  if (!nickname || nickname.indexOf(' | ') === -1) {
    discordClient.logger.warn(`Invalid nickname: "${nickname}"`);
    return;
  }

  const teamId = nickname.split(' | ')[1];
  const program = programsByTeam.get(teamId) ?? 'Non-Competitor';
  const division = divisionsByTeam.get(teamId) ?? 'Non-Competitor';
  const programRole = member.guild.roles.cache.find(
    ({name}) => name === program
  );
  const divisionRole = member.guild.roles.cache.find(
    ({name}) => name === division
  );
  if (!programRole) {
    discordClient.logger.warn(`No role found for program: ${program}`);
    return;
  }
  if (!divisionRole) {
    discordClient.logger.warn(`No role found for division: ${division}`);
    return;
  }

  if (!member.roles.cache.hasAll(programRole.id, divisionRole.id)) {
    await member.roles.set([programRole, divisionRole]);
  }
};

const main = async () => {
  await updateDivisions();
  setInterval(async () => {
    await updateDivisions();
    await updateRoles();
  }, 600_000);
  try {
    discordClient.logger.info('Logging in');
    await discordClient.login();
    discordClient.logger.info('Logged in');
  } catch (error) {
    discordClient.logger.fatal(error);
    discordClient.destroy();
    process.exit(1);
  }
};

main();
