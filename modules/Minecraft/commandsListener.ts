import { Client, Interaction, Events, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import Database from '@helpers/database';
import { Logging } from '@helpers/logging';
import { getEnv } from '@helpers/env.ts';
import util, { JavaStatusResponse } from 'minecraft-server-util';

export default class CommandsListener {
	private client: Client;
	
	constructor(client: Client) {
		this.client = client;
		void this.commandListener();
	}
	
	async commandListener(): Promise<void> {
		this.client.on(Events.InteractionCreate, async (interaction: Interaction): Promise<void> => {
			if (!interaction.isCommand()) return;
			
			const { commandName } = interaction;
			// @ts-ignore
			const subCommandName: any = interaction.options.getSubcommand();
			
			if (commandName !== 'minecraft') return;
			
			switch (subCommandName) {
				case 'whitelist':
					void this.whitelist(interaction);
					break;
				case 'verwijder_whitelist':
					void this.whitelistDelete(interaction);
					break;
				case 'online':
					void this.getOnlineUsers(interaction);
					break;
			}
		});
	}
	
	async whitelist(interaction: Interaction): Promise<void> {
		if (!interaction.isCommand()) return;
		
		const commandInteraction = interaction as unknown as ChatInputCommandInteraction;
		const options = commandInteraction.options;
		
		try {
			const resp: Response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${options.getString('gebruikersnaam')}`)
			const minecraftUsernameInDB = await Database.select('minecraft', ['user_id', 'minecraft_username'], {user_id: interaction.user.id});
			
			if (resp.status === 404 ) {
				await interaction.reply('Je gebruikersnaam is niet gevonden!');
				Logging.warn(`I didn't found Minecraft username ${options.getString('gebruikersnaam')}`);
			}
			
			if (resp.status !== 200) {
				return
			}
			
			if (minecraftUsernameInDB.length < 1) {
				await Database.insert('minecraft', { user_id: interaction.user.id, minecraft_username: options.getString('gebruikersnaam') });
				await interaction.reply('Je Minecraft gebruikersnaam is toegevoegd!');
			} else {
				await Database.update('minecraft', {user_id: interaction.user.id}, {minecraft: options.getString('gebruikersnaam')});
				await interaction.reply('Je Minecraft gebruikersnaam is aangepast!');
			}
			
			Logging.info(`Added the Minecraft username ${options.getString('gebruikersnaam')} to the database.`);
		} catch (error) {
			await interaction.reply('Oeps! Er ging iets mis! Het probleem is gerapporteerd aan de developer.');
			Logging.error(`Error checking Minecraft username: ${error}`);
		}
	}
	
	async whitelistDelete(interaction: Interaction): Promise<void> {
		if (!interaction.isCommand()) return;
		
		try {
			await Database.delete('minecraft', {user_id: interaction.user.id});
			await interaction.reply('Je Minecraft gebruikersnaam is verwijderd!');
			Logging.info(`A minecraft username has been deleted successfully.`);
		} catch (error) {
			await interaction.reply('Oeps! Er ging iets mis! Het probleem is gerapporteerd aan de developer.');
			Logging.error(`Error deleting Minecraft username: ${error}`);
		}
	}

	async getOnlineUsers(interaction: Interaction): Promise<void> {
		if (!interaction.isCommand()) return;

		try {
			const promises = [
				util.status(<string>getEnv('MC_IP'), parseInt(<string>getEnv('MC_LOBBY_PORT'))),
				util.status(<string>getEnv('MC_IP'), parseInt(<string>getEnv('MC_SURVIVAL_PORT'))),
				util.status(<string>getEnv('MC_IP'), parseInt(<string>getEnv('MC_CREATIVE_PORT'))),
				util.status(<string>getEnv('MC_IP'), parseInt(<string>getEnv('MC_MINIGAMES_PORT'))),
			];

			const results = await Promise.allSettled(promises);

			const mcLobby: PromiseSettledResult<JavaStatusResponse> = results[0];
			const mcSurvival: PromiseSettledResult<JavaStatusResponse> = results[1];
			const mcCreative: PromiseSettledResult<JavaStatusResponse> = results[2];
			const mcMiniGames: PromiseSettledResult<JavaStatusResponse> = results[3];

			console.log(`${mcLobby.value.players.online}`);
			console.log(`${mcSurvival.value.players.online}`);
			console.log(`${mcCreative.value.players.online}`);

			console.log(`${mcMiniGames.value.players.online}`);

			await interaction.reply('Jeeej');
		} catch (error) {
			await interaction.reply('Er ging iets mis! Probleem is gerapporteerd aan de developer.');
			Logging.error(`Error getting to Minecraft server in getOnlineUsers: ${error}`);
		}
	}
}