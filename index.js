import axios from "axios";
import { Client } from "fca-utils";
import { Configuration, OpenAIApi } from "openai";

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
client.on('ready', (_, bid) => console.log("Logged in as", bid, `[${process.env.PREFIX}]`));

client.on('command', (command) => {
    if (command.name === "ai") {
        client.getApi()?.sendTypingIndicator(command.message.threadID);
        openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            max_tokens: 1000,
            n: 1,
            messages: [{
                role: "user",
                content: command.commandArgs.join(" ")
            }]
        }).then(async res => {
            try {
                const parsedContent = (await axios.get(`https://xva-api.up.railway.app/api/extractgpt?content=${encodeURIComponent(res.data.choices[0].message.content)}&maxCharacterPerLine=6000`)).data;
                const result = parsedContent.data.result;

                for (let i = 0; i < result.length; i++) {
                    await command.message[i === 0 ? "reply" : "send"](result[i])
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (e) {
                console.error(e.response.data);
                command.message.reply("An error occurred!")
            }
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
        }).then(res => {
            command.message.sendAttachment(res.data.data[0].url);
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
