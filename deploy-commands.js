/**
 * @file deploy-commands.js
 * @description Command deployment script for registering slash commands with Discord
 * @author Marrow
 * @created 2024-07-31
 * @lastModified 2024-08-01
 * @version 1.2.0
 * 
 * @changelog
 * - 1.2.0 (2024-08-01): Streamlined deployment process, removed excessive comments
 * - 1.1.0 (2024-07-31): Added support for nested command folders
 * - 1.0.0 (2024-07-31): Initial deployment script for slash commands
 * 
 * @dependencies discord.js, node:fs, node:path
 * @permissions None required (script only)
 */

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();