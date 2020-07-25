const { MessageFactory } = require('botbuilder');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { Channels } = require('botbuilder-core');
const {UserProfile} = require("../models/userProfile");

const USER_PROFILE = 'USER_PROFILE';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class MainDialog extends ComponentDialog{
    constructor(userState){
        super("mainDialog");
        this.userProfile = userState.createProperty(USER_PROFILE);
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog( new WaterfallDialog(WATERFALL_DIALOG, [
            this.selectTipo.bind(this),
            this.confirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async run (turnContext, accessor){
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if(results.status === DialogTurnStatus.empty){
            await dialogContext.beginDialog(this.id);
        }
    }
    async selectTipo(step){
        return await step.prompt(CHOICE_PROMPT, {
            prompt: "Bienvenido usted es Proveedor o Consumidor",
            choices:  ChoiceFactory.toChoices(["Proveedor", "Consumidor"])
        });
    }
    async confirmStep(step) {
        step.values.tipo = step.result.value;
        return await step.prompt(CHOICE_PROMPT, {
            prompt: "Es Correcto?",
            choices:  ChoiceFactory.toChoices(["Si", "No"])
        });
    }
    async summaryStep(step) {
        if (step.result.value === "Si") {
            // Get the current profile object from user state.
            const userProfile = await this.userProfile.get(step.context, new UserProfile());
            userProfile.tipo = step.values.tipo;
            console.log(userProfile)
            let msg = `Usted esta seleccionado como ${ userProfile.tipo } `;
            msg += '.';
            await step.context.sendActivity(msg);
        } else {
            await step.context.sendActivity('Thanks. Your profile will not be kept.');
        }
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        return await step.endDialog();
    }
}
module.exports.MainDialog = MainDialog;