import {SapphireClient} from '@sapphire/framework';
import '@sapphire/plugin-logger/register';
import axios from 'axios';
import {GatewayIntentBits, type GuildMember} from 'discord.js';
import 'source-map-support/register';
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
    eventId: 49726,
    divisions: [
      'Arts (MS)',
      'Innovate (MS)',
      'Spirit (MS)',
      'Design (MS)',
      'Research (MS)',
      'Opportunity (MS)',
    ],
  },
  {
    eventId: 49725,
    divisions: [
      'Math (HS)',
      'Technology (HS)',
      'Science (HS)',
      'Engineering (HS)',
      'Arts (HS)',
      'Innovate (HS)',
      'Spirit (HS)',
      'Design (HS)',
      'Research (HS)',
      'Opportunity (HS)',
    ],
  },
  {
    eventId: 49727,
    divisions: ['Technology (VEX U)', 'Science (VEX U)'],
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
        discordClient.logger.info(
          'event',
          eventId,
          'page',
          page,
          '/',
          lastPage
        );
      } while (page < lastPage);
      discordClient.logger.info('event', eventId, 'teams', teams.length);
      return {eventId, divisions, teams};
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
  let i = 0;
  for (const member of manageableMembers) {
    discordClient.logger.info(
      `Setting division for ${member} (${++i}/${manageableMembers.length})`
    );
    await setDivision(member, member.displayName);
  }
  discordClient.logger.info('DONE SETTING DIVISIONS');
};

export const setDivision = async (member: GuildMember, nickname: string) => {
  if (!nickname || nickname.indexOf(' | ') === -1) {
    discordClient.logger.warn(`Invalid nickname: "${nickname}"`);
    return;
  }

  const teamId = nickname.split(' | ')[1];
  const division = divisionsByTeam.get(teamId) ?? 'Non-Competitor';
  discordClient.logger.info(teamId + ' | ' + division);

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
    throw error;
  }
};

main();
