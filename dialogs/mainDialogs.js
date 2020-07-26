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
// const { Channels } = require('botbuilder-core');
const { ConsumidorDialog, CONSUMIDOR_DIALOG } = require("./consumidorDialog")
const {UserProfile} = require("../models/userProfile");

const USER_PROFILE = 'USER_PROFILE';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

const { formaterTextOptions } =require ("./formaterArray");
class MainDialog extends ComponentDialog{
    constructor(userState){
        super("mainDialog");
        this.userProfile = userState.createProperty(USER_PROFILE);
        this.tipoUsuario = ["Soy productor 📤", "Soy consumidor 📥"]
        this.addDialog(new ConsumidorDialog());
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog( new WaterfallDialog(WATERFALL_DIALOG, [
            this.selectTipo.bind(this),
            this.confirmStep.bind(this),
            this.tipoUsuarioStep.bind(this),
            this.finalStep.bind(this)
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
    async selectTipo(stepContext){
        stepContext.values.userInfo = new UserProfile();

        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: `Hola soy Pacha y estoy aqui para ayudarte 👩🏼‍🔧 \n\n ${formaterTextOptions(this.tipoUsuario)}`,
            choices:  ChoiceFactory.toChoices(this.tipoUsuario)
        });
    }
    async confirmStep(stepContext) {
        stepContext.values.userInfo.tipo = stepContext.result.value;
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: "Es Correcto?",
            choices:  ChoiceFactory.toChoices(["Si", "No"])
        });
    }
    async tipoUsuarioStep(stepContext) {
        if (stepContext.result.value === "Si") {
            // Get the current profile object from user state.
            console.log(stepContext.values)
            switch(stepContext.values.userInfo.tipo){
                case "Proveedor":
                    await stepContext.context.sendActivity('Módulo del proveedor en desarrollo');
                    return await stepContext.next()
                case "Consumidor":
                    return await stepContext.beginDialog(CONSUMIDOR_DIALOG);
                default:
                    await stepContext.context.sendActivity('No se encontro');
                    console.log(stepContext.values)
                    return await stepContext.next()
                    
            }
        }else{
            await stepContext.context.sendActivity('Ingrese nuevamente');
            return await stepContext.endDialog();
        }
    }

    async finalStep(stepContext) {
        const userProfile = stepContext.values.userInfo;
        userProfile.tipoConsumidor = stepContext.result.tipoConsumidor;
        userProfile.ubicacion = stepContext.result.ubicacion;
        switch (userProfile.tipo){
            case "Proveedor":
                await stepContext.context.sendActivity(`Gracias, vuelva prontos ${userProfile.tipo}`);
                break;
            case "Consumidor":
                await stepContext.context.sendActivity(`Gracias, vuelva prontos ${userProfile.tipo} ${userProfile.tipoConsumidor}!`);
                break;
        }
        // await this.userProfileAccessor.set(stepContext.context, userInfo);
        return await stepContext.endDialog();
    }
}
module.exports.MainDialog = MainDialog;