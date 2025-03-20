// modules/Birthday/commandsListener.ts

import { Client, Interaction, Events } from 'discord.js';
import Database from '@helpers/database';
import { Logging } from '@helpers/logging';

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
			
			if (commandName !== 'verjaardag') return;
			
			switch (subCommandName) {
				case 'toevoegen':
					this.birthdayAdd(interaction);
					break;
				case 'verwijderen':
					this.birthdayRemove(interaction);
					break;
				case 'lijst':
					this.birthdayList(interaction);
					break;
			}
		});
	}
	
	birthdayAdd(interaction: Interaction): void {
		Logging.info('Adding a birthday')
	}
	
	birthdayRemove(interaction: Interaction): void {
		Logging.info('Deleted a birthday');
	}
	
	birthdayList(interaction: Interaction): void {
		Logging.info('Showing birthday list');
	}
}