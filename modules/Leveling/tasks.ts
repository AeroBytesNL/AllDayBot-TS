import { Logging } from '@utils/logging.ts';
import LevelingEvents from './events.ts';
import QueryBuilder from '@utils/database';
import { Client, ChannelType, VoiceChannel, Guild } from 'discord.js';
import cron from 'node-cron';

export default class LevelingTasks {
    private client: Client;

    constructor(client: Client) {
        this.client = client;
        cron.schedule('* * * * *', async (): Promise<void> => {
            Logging.debug(`Running Cron "addXpToMembersTask"`);
            void this.addXpToMembersTask();
        });
    }

    async addXpToMembersTask(): Promise<void> {
        for (const userId of LevelingEvents.getUserXpAddedFromMessages()) {
            try {
                await this.addXpToMember(userId, this.generateRandomNumber(15, 25));
            } catch (error: any) {
                Logging.error(`Error processing user ${userId} in Leveling "addXpToMembersTask": ${error}`);
            }
        }

        LevelingEvents.purgeUserXpAddedFromMessages();

        try {
            Logging.debug('Looking into voice channels to add XP');
            const guild = await this.client.guilds.fetch('1093873145313767495') as Guild;

            if (!guild) return;

            const channels = await guild.channels.fetch();
            const voiceChannels = [...channels.filter(channel => channel?.type === ChannelType.GuildVoice).values()] as VoiceChannel[];

            for (const voiceChannel of voiceChannels) {
                if (!voiceChannel || !voiceChannel.members.size) continue;

                if (voiceChannel.name === 'AFK' || voiceChannel.name === 'afk') return;

                for (const member of voiceChannel.members.values()) {
                    await this.addXpToMember(member.id, this.generateRandomNumber(4, 6));

                    Logging.debug(`Someone is in VC: ${member.user.tag}`)
                }
            }
        } catch (error) {
            console.error(`Error inside checkVoiceChannels: ${error}`);
        }

        Logging.debug('Adding XP to members');
    }

    async addXpToMember(userId: String, xpToAdd: number) {
        const user = await QueryBuilder
            .select('leveling')
            .columns(['xp', 'level'])
            .where({'user_id': `${userId}`})
            .first();

        if (user == undefined) {
            await QueryBuilder
                .insert('leveling')
                .values({user_id: userId, xp: xpToAdd})
                .execute();
            return;
        }

        const newXp: number = user.xp + xpToAdd;

        if (newXp < Math.floor(8.196 * Math.pow(user.level + 1, 2.65) + 200)) {
            await QueryBuilder.update('leveling')
                .set({xp: newXp})
                .where({user_id: userId})
                .execute();
            return;
        }

        await QueryBuilder.update('leveling')
            .set({xp: newXp, level: user.level + 1})
            .where({user_id: userId})
            .execute();
        // TODO: send message to channel
    }

    generateRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}