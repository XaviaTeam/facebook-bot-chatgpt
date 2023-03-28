import { OpenAIApi, Configuration } from "openai";
import { Client } from "fca-utils";
import axios from "axios";

const config = new Configuration({
    apiKey: process.env.OPENAI_KEY
})

const openai = new OpenAIApi(config);

const client = new Client({
    prefix: process.env.PREFIX,
    ignoreMessageInCommandEvent: true
})

client.openServer(process.env.PORT);
client.loginWithAppState(process.env.APPSTATE);
client.on('ready', () => console.log("Logged in!"));

client.on('command', (command) => {
    if (command.name === "ai") {
        openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            max_tokens: 1000,
            n: 1,
            messages: [{
                role: "user",
                content: command.commandArgs.join(" ")
            }]
        }).then(res => {
            command.message.reply(res.data.choices[0].message.content)
        }).catch(e => {
            console.error(e.response.data);
            command.message.reply("An error occurred!")
        })
    }

    if (command.name === "create") {
        openai.createImage({
            prompt: command.commandArgs.join(" "),
            size: "512x512",
            response_format: "url"
        }).then(async res => {
            command.message.reply({
                body: "",
                attachment: (await axios.get(res.data.data[0].url, { responseType: "stream" })).data
            })
        }).catch(e => {
            console.error(e.response.data);
            command.message.reply("An error occurred!")
        })
    }
})

client.on('error', (e) => {
    console.error("login error");
    console.error(e);
})
