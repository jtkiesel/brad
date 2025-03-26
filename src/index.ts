import { SapphireClient } from "@sapphire/framework";
import "@sapphire/plugin-logger/register";
import axios from "axios";
import { GatewayIntentBits, type GuildMember } from "discord.js";
import {
  logLevel,
  robotEventsToken,
  serverId,
  vexWorldsFile,
} from "./lib/config.js";
import fs from "node:fs/promises";

const discordClient = new SapphireClient({
  shards: "auto",
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  logger: { level: logLevel },
});

const divisionsByTeam = new Map<string, string>();

export const update = async () => {
  await updateDivisions();
  await updateRoles();
};

type VexWorlds = {
  events: {
    id: string;
    divisions: string[];
    teams?: string[];
  }[];
};

const fetchTeams = async (eventId: string) => {
  const teams: string[] = [];
  let page = 0;
  let lastPage: number;
  do {
    const {
      data: { meta, data },
    } = await axios.get<{
      meta: { last_page: number };
      data: { number: string }[];
    }>(
      `https://www.robotevents.com/api/v2/events/${eventId}/teams?per_page=250&page=${++page}`,
      { headers: { Authorization: `Bearer ${robotEventsToken}` } },
    );
    data.forEach(({ number }) => teams.push(number));
    lastPage = meta.last_page;
  } while (page < lastPage);
  return teams;
};

const updateDivisions = async () => {
  const vexWorlds: VexWorlds = JSON.parse(
    await fs.readFile(vexWorldsFile, { encoding: "utf-8" }),
  );
  const events = await Promise.all(
    vexWorlds.events.map(async ({ id, divisions, teams }) => ({
      divisions,
      teams: teams ?? (await fetchTeams(id)),
    })),
  );
  divisionsByTeam.clear();
  events.forEach(({ divisions, teams }) =>
    teams.forEach((team, index) =>
      divisionsByTeam.set(team, divisions[index % divisions.length]),
    ),
  );
};

const updateRoles = async () => {
  const guild = await discordClient.guilds.fetch(serverId);
  const members = await guild.members.fetch();
  const manageableMembers = Array.from(
    members.filter((member) => member.manageable).values(),
  );
  await Promise.all(
    manageableMembers.map((member) => setRoles(member, member.displayName)),
  );
  discordClient.logger.info("DONE UPDATING ROLES");
};

export const setRoles = async (member: GuildMember, nickname: string) => {
  if (!nickname || nickname.indexOf(" | ") === -1) {
    discordClient.logger.warn(`Invalid nickname: "${nickname}"`);
    return;
  }

  const roleNames = ["Verified"];
  const teamId = nickname.split(" | ")[1];
  const division = divisionsByTeam.get(teamId);
  if (division) {
    roleNames.push(division);
  }
  const roles = member.guild.roles.cache.filter(({ name }) =>
    roleNames.includes(name),
  );
  if (division && roles.size < 2) {
    discordClient.logger.warn(`No role found for division: ${division}`);
    return;
  }

  if (!member.roles.cache.hasAll(...roles.keys())) {
    await member.roles.set(roles);
  }
};

const main = async () => {
  try {
    discordClient.logger.info("Updating divisions");
    await updateDivisions();
    discordClient.logger.info("Updated divisions");

    discordClient.logger.info("Logging in");
    await discordClient.login();
    discordClient.logger.info("Logged in");

    discordClient.logger.info("Updating roles");
    await updateRoles();
    discordClient.logger.info("Updated roles");

    setInterval(async () => await update(), 600_000);
  } catch (error) {
    discordClient.logger.fatal(error);
    throw error;
  }
};

process.on("SIGTERM", async () => {
  await discordClient.destroy();
});

main();
