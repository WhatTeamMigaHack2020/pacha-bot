const { ActivityHandler, MessageFactory } = require('botbuilder');
const WELCOMED_USER = 'welcomedUserProperty';
class WelcomeBot extends ActivityHandler {
constructor(userState) {
        super();

        this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);
        this.userState = userState;

        this.onMessage(async (context, next) => {
            console.log("context##onMessage")
            console.log(context.activity)
            console.log(context.activity.membersAdded)
            console.log("context##onMessage")

            const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);
            if (didBotWelcomedUser === false) {
                const userName = context.activity.from.name;
                await context.sendActivity(`First Message Welcome ${ userName }.!`);
                await this.welcomedUserProperty.set(context, true);
            }else{
                const replyText = `Echo: ${ context.activity.text }`;
                await context.sendActivity(MessageFactory.text(replyText, replyText));
            }
            await next();
        });
    }
    async run (context){
        await super.run(context);
        await this.userState.saveChanges(context);
    }
}

module.exports.WelcomeBot = WelcomeBot;
