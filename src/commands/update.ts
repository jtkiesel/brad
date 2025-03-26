import { ApplyOptions } from "@sapphire/decorators";
import { Command, CommandOptionsRunTypeEnum } from "@sapphire/framework";
import {
  PermissionsBitField,
  type ChatInputCommandInteraction,
} from "discord.js";
import { update } from "../index.js";

@ApplyOptions<Command.Options>({
  description: "Update division roles for all server members",
  requiredClientPermissions: [PermissionsBitField.Flags.ManageRoles],
  requiredUserPermissions: [PermissionsBitField.Flags.ManageGuild],
  runIn: [CommandOptionsRunTypeEnum.GuildAny],
})
export class UpdateCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "Command only available in servers",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Starting update",
      ephemeral: true,
    });

    await update();
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (command) => command.setName(this.name).setDescription(this.description),
      { idHints: ["1083262483063652392"] },
    );
  }
}
