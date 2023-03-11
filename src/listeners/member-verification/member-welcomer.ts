import {ApplyOptions} from '@sapphire/decorators';
import {Events, Listener} from '@sapphire/framework';
import {
  channelMention,
  ChannelType,
  inlineCode,
  roleMention,
  type GuildMember,
} from 'discord.js';
import {adminRoleId, newMembersChannelId, rulesChannelId} from '../..';

@ApplyOptions<Listener.Options>({event: Events.GuildMemberAdd})
export class GuildMemberAddListener extends Listener<
  typeof Events.GuildMemberAdd
> {
  public override async run(member: GuildMember) {
    const newMembers = await member.guild.channels.fetch(newMembersChannelId);
    if (newMembers?.type !== ChannelType.GuildText) {
      return;
    }

    newMembers.send(
      `Welcome, ${member}! To access this server, you must be verified.\nPlease take a moment to read our server ${channelMention(
        rulesChannelId
      )}, then send a message here with your name (or preferred nickname) and team ID (such as ${inlineCode(
        'Kayley | 24B'
      )} or ${inlineCode('Jordan | BNS')}), or ask one of the ${roleMention(
        adminRoleId
      )} for help.`
    );
  }
}
