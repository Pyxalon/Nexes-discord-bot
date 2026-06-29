require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();


const commandFolders = fs.readdirSync(path.join(__dirname, "commands"));

for (const folder of commandFolders) {

    const folderPath = path.join(__dirname, "commands", folder);

    if (fs.lstatSync(folderPath).isDirectory()) {

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            client.commands.set(command.name, command);
        }

    } else if (folder.endsWith(".js")) {

        const command = require(`./commands/${folder}`);
        client.commands.set(command.name, command);

    }
}

const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {

        const event = require(`./events/${file}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }

    }

} else {

    console.warn("⚠️ No events folder found.");

}

client.once("ready", () => {

    console.clear();
    console.log("🤖 Nexes Bot");
});

if (!fs.existsSync(path.join(__dirname, "events", "messageCreate.js"))) {

    client.on("messageCreate", message => {

        if (message.author.bot) return;

        const prefix = "!";

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);

        if (!command) return;

        try {
            command.execute(message, args);
        } catch (err) {
            console.error(err);
            message.reply("❌ There was an error executing that command.");
        }

    });

}

client.login(process.env.TOKEN);
