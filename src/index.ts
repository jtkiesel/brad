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
    eventId: 49725,
    divisions: [
      'Math (VRC HS)',
      'Technology (VRC HS)',
      'Science (VRC HS)',
      'Engineering (VRC HS)',
      'Arts (VRC HS)',
      'Innovate (VRC HS)',
      'Spirit (VRC HS)',
      'Design (VRC HS)',
      'Research (VRC HS)',
      'Opportunity (VRC HS)',
    ],
  },
  {
    eventId: 49726,
    divisions: [
      'Science (VRC MS)',
      'Technology (VRC MS)',
      'Engineering (VRC MS)',
      'Math (VRC MS)',
      'Arts (VRC MS)',
      'Opportunity (VRC MS)',
    ],
  },
  {
    eventId: 49727,
    divisions: ['Research (VEX U)', 'Design (VEX U)'],
  },
];
const divisionsByTeam = new Map<string, string>();

export const updateDivisions = async () => {
  const events = await Promise.all(
    programs.map(async ({eventId, divisions}) => {
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
      return {divisions, teams};
    })
  );
  divisionsByTeam.clear();
  events.forEach(({divisions, teams}) =>
    teams.forEach((team, index) =>
      divisionsByTeam.set(team, divisions[index % divisions.length])
    )
  );
};

export const updateRoles = async () => {
  const guild = await discordClient.guilds.fetch(serverId);
  const members = await guild.members.fetch();
  const manageableMembers = Array.from(
    members.filter(member => member.manageable).values()
  );
  await Promise.all(
    manageableMembers.map(member => setRoles(member, member.displayName))
  );
  discordClient.logger.info('DONE UPDATING ROLES');
};

export const setRoles = async (member: GuildMember, nickname: string) => {
  if (!nickname || nickname.indexOf(' | ') === -1) {
    discordClient.logger.warn(`Invalid nickname: "${nickname}"`);
    return;
  }

  const teamId = nickname.split(' | ')[1];
  const division = divisionsByTeam.get(teamId) ?? 'Non-Competitor';
  const divisionRole = member.guild.roles.cache.find(
    ({name}) => name === division
  );
  if (!divisionRole) {
    discordClient.logger.warn(`No role found for division: ${division}`);
    return;
  }

  if (!member.roles.cache.has(divisionRole.id)) {
    await member.roles.set([divisionRole]);
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
