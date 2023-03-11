import {ApplyOptions} from '@sapphire/decorators';
import {Events, Listener} from '@sapphire/framework';
import axios from 'axios';
import {inlineCode, type Message} from 'discord.js';
import {adminRoleId, newMembersChannelId, setDivision} from '../..';
import {robotEventsToken} from '../../lib/config';

@ApplyOptions<Listener.Options>({event: Events.MessageCreate})
export class MessageCreateListener extends Listener<
  typeof Events.MessageCreate
> {
  public override async run(message: Message) {
    if (
      !message.member ||
      message.channelId !== newMembersChannelId ||
      message.author.id === this.container.client.id ||
      message.member.roles.cache.has(adminRoleId)
    ) {
      return;
    }

    const nickname = message.content.split('|');
    if (nickname.length !== 2) {
      await message.reply(
        `Incorrect format. Separate name and team ID by a single ${inlineCode(
          '|'
        )} (example: ${inlineCode('Jordan | 24C')})`
      );
      return;
    }

    const name = nickname[0].trim();
    const teamId = nickname[1].trim().toUpperCase();
    if (!/^([0-9]{1,5}[A-Z]?|[A-Z]{2,6}[0-9]{0,2})$/.test(teamId)) {
      await message.reply(
        `Please enter a valid team ID (example: ${inlineCode(
          '24B'
        )}, or ${inlineCode('BNS2')})`
      );
      return;
    }

    const {
      data: {
        meta: {total},
      },
    } = await axios.get<{meta: {total: number}}>(
      `https://www.robotevents.com/api/v2/teams?number[]=${teamId}`,
      {headers: {Authorization: `Bearer ${robotEventsToken}`}}
    );
    if (total === 0) {
      await message.reply('That team ID does not exist');
      return;
    }

    const newNickname = `${name} | ${teamId}`;
    await message.member.setNickname(newNickname);
    await setDivision(message.member, newNickname);
  }
}
