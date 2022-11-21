const ytdl = require('ytdl-core');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
//const { info } = require('console');

/** CONFIGURAÇÕES */

const client = new Client({
    ffmpegPath: 'ffmpeg/bin/ffmpeg.exe',
    authStrategy: new LocalAuth(),
    puppeteer: {executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'},
});

client.on('ready', () => {
    console.log('whatsapp-web.js funcionando');
});

/** COMANDOS SÍNCRONOS */

client.on('message', msg => {
    comando = msg.body.split(' ', 1)
    comando = comando[0]
    argumento = msg.body.slice(comando.length+1, msg.body.length)

    if (comando === '!help'){
        msg.reply(
        "Olá, meu nome é Lili Bot, veja o que posso fazer:\n"
        +"\n\n*!yt [link do Youtube]* - Retorna uma url para baixar um vídeo do Youtube."
        +"\n\n*!sm [link para encurtar]* - Retorna uma url encurtada de algum site."
        +"\n\n*!s* - Transforma imagem/vídeo/gif enviado em figurinha."
        +"\n\n*!gif* - Transforma um video em gif."
        +"\n\n*!mt* - Menciona todos os participantes do grupo (necessário privilégio de Administrador)."
        +"\n\n*!help* - Comandos de ajuda."
        +"\n\n\n\n```PS: Ainda estou em desenvolvimento. Volte mais tarde para saber das novidades ;)```"
        )
    }

    if (comando === '!yt') {
        if(argumento.length > 0){
            ytdl.getInfo(argumento)
            .then(
                data => {
                    axios.post('https://api.encurtador.dev/encurtamentos', {url: data.formats[0].url})
                    .then(response => response.data.urlEncurtada) 
                    .then(linkcurto => msg.reply('https://'+linkcurto))
                    .catch(err => console.log(err));
                }
            )
            //.catch(msg.reply("Não consegui baixar. Verifique o link ou tente novamente mais tarde."))
        } else msg.reply("Não consegui identificar a url. Tente dessa maneira:\n*!yt http://www.youtube.com/watch?v=9dewcOX0o*")
    } 

    if (comando === '!sm') {
        if(argumento.length > 0){
            axios.post('https://api.encurtador.dev/encurtamentos', {url: argumento})
            .then(response => response.data.urlEncurtada)
                .then(json => msg.reply('https://'+json))
                .catch(err => msg.reply("Não consegui encurtar, verifique se o link é válido."))
        }else msg.reply("Não consegui identificar a url. Tente dessa maneira:\n*!sm http://www.google.com.br*")
    }
});

/** COMANDOS ASSÍNCRONOS */

client.on('message', async (msg) => {
    if(msg.body === '!mt') {
        const telefone = (await msg.getContact()).id.user;
        const groupChat = await msg.getChat();
        const botChatObj = await groupChat.participants.find(chatObj => chatObj.id.user === telefone);
        if (botChatObj.isAdmin){
            const chat = await msg.getChat();
        
            let text= '*Marcando todos*:\n';
            let mentions = [];

            for(let participant of chat.participants) {
                const contact = await client.getContactById(participant.id._serialized);
                
                mentions.push(contact);
                text +='\n';
                text += `@${participant.id.user}`;
            }
            await chat.sendMessage(text, { mentions });
        }
        else
        {
            msg.reply("Apenas administradores podem invocar esse comando!")
        }
    }
    if(msg.hasMedia && msg.body === "!s") {
        
        const media = await msg.downloadMedia();
        console.log("recebi uma mídia")
        const chat = await msg.getChat();
        chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Lili Bot"})
    }

    if(msg.hasMedia && msg.body === "!gif") {
        const media = await msg.downloadMedia();
        console.log("recebi uma mídia")
        const chat = await msg.getChat();
        chat.sendMessage(media, {sendVideoAsGif: true})
    }
        //const chat = await msg.getChat(); // INFOS DO GRUPO
        //console.log(await chat.id._serialized) // PEGA MINHAS INFORMAÇÕES ()
        //console.log(await msg.getContact()) // PEGA MINHAS INFORMAÇÕES. (ID SERIALIZED)
        //console.log(await chat.isGroup) // VERIFICA SE É GRUPO
        //console.log(await client.getContactById(await chat.id._serialized))
        // console.log(await client.getNumberId())

});

client.initialize();