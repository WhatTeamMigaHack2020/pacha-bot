global.XMLHttpRequest = require('xhr2');
global.WebSocket = require('ws');
const path = require('path');
const dotenv = require('dotenv');
const express = require('express')
const { MessagingResponse } = require('twilio').twiml;
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
const client = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const {convertUrlToLatLong, convertLatLongToUrl} = require("./dialogs/formaterUrlGPS")
const { BotFrameworkAdapter, UserState, MemoryStorage, ConversationState } = require('botbuilder');
const { DirectLine } = require('botframework-directlinejs');
const { WelcomeBot } = require('./bots/mainBot');
const { MainDialog } = require('./dialogs/mainDialogs');
const {isUrl} = require("./dialogs/formaterUrlGPS")
const { url } = require('inspector');
//const {clientMongo} = require("./models/dbPacha")

const app = express()
const port = process.env.port || process.env.PORT || 3978
// console.log(clientMongo)

storageTemp = []

app.get('/', (req, res) => res.send(`<iframe src='https://webchat.botframework.com/embed/flask-sample-mongo-bot?s=${process.env.BotSecretID}'  style='min-width: 400px; width: 100%; min-height: 500px;'></iframe>)`));
app.get('/policy',function(req,res) {
    res.sendFile(__dirname + '/policy.html');
  });

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] unhandled error: ${ error }`);
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const maindialog = new MainDialog(userState);
const myBot = new WelcomeBot(conversationState, userState, maindialog);



app.listen(port,'0.0.0.0', () => console.log(`Example app listening at http://0.0.0.0:${port}`))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Listen for incoming requests.
app.post('/api/messages', (req, res) => {
    // console.log("POST#MESSAGE");
    // console.log(req.body);
    // console.log("POST#MESSAGE");
    adapter.processActivity(req, res, async (context) => {
        // Route to main dialog.
        await myBot.run(context);
        // console.log("asd");
        // console.log(await convertUrlToLatLong("https://www.google.com/maps/@-16.4928875,-68.1300009,z20"));
        // console.log("bcd");
    });
});



const goodBoyUrl = 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?'
  + 'ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80';

app.post('/whatsapp', async (req, res) => {
    try {
    const { body } = req;
    var directLine = new DirectLine({
        token: process.env.BotSecretID,
        conversationId: storageTemp[body.From] === undefined ? "": storageTemp[body.From].id
    });
    console.log("POST#WP");
    console.log(body);
    console.log("POST#WP");
    let messageTwilio;
    
    if (body.NumMedia > 0) {
        messageTwilio = new MessagingResponse().message("Thanks for the image! Here's one for you!");
        messageTwilio.media(goodBoyUrl);
        res.set('Content-Type', 'text/xml');
        res.send(messageTwilio.toString()).status(200);
    } else {
        let bodyText = ""
        if (body.Latitude !== undefined || body.Longitude !== undefined){
            let urlPos = convertLatLongToUrl(body.Latitude, body.Longitude ,"z20")
            // messageTwilio = new MessagingResponse().message('THanks for your POsition');
            // res.set('Content-Type', 'text/xml');
            // res.send(messageTwilio.toString()).status(200);
            bodyText = urlPos;
        }else{
            bodyText = body.Body;
        }
        console.log(bodyText)
        directLine.postActivity({
            from: { id: body.From, name: body.From.replace("whatsapp:","") },
            type: 'message',
            text: bodyText
        }).subscribe(
            id => console.log("Posted activity, assigned ID ", id),
            error => console.log("Error posting activity", error)
            );
                
        directLine.activity$
            .filter(activity => activity.type === 'message'&& activity.from.id === process.env.ID_BOT_DIRECT_LINE )
            .subscribe(
                message => {
                    console.log("storageTemp")
                    console.log(storageTemp)
                    console.log("storageTemp")
                    myPhone =body.From
                    if (! (body.From in storageTemp)){
                        storageTemp[body.From] = {id: message.conversation.id, ultimateMessage: message.id};
                    }else{
                        if (storageTemp[body.From].ultimateMessage == message.id){
                            return 
                        }else{
                            storageTemp[body.From].ultimateMessage = message.id
                        }
                    }
                    try {
                        

                        console.log("received message ", message);
                        console.log(message.text)
                        messageTwilio = new MessagingResponse().message(message.text);
                        if (isUrl(message.text)){
                            messageTwilio.media(message.text);
                        }
                        res.set('Content-Type', 'text/xml');
                        res.send(messageTwilio.toString()).status(200);
                    } catch (error) {
                        console.log(error);
                        if (isUrl(message.text)){
                            client.messages
                            .create({
                                mediaUrl: [message.text],
                                from:process.env.TWILIO_PHONE,
                                body: message.text,
                                to: myPhone
                            })
                            .then(message => console.log(message.sid));
                        }else{
                            client.messages
                            .create({
                                from:process.env.TWILIO_PHONE,
                                body: message.text,
                                to: myPhone
                            })
                            .then(message => console.log(message.sid));
                        }


                    }
                });
        
    }

    } catch (error) {
        console.log(error);
        messageTwilio = new MessagingResponse().message("Algo salio mal");
        res.set('Content-Type', 'text/xml');
        res.send(messageTwilio.toString()).status(200);
        
    }
});

	
