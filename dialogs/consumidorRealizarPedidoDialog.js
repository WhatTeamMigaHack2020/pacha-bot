const { MessageFactory } = require('botbuilder');
const { ComponentDialog,TextPrompt,WaterfallDialog, ChoicePrompt, ChoiceFactory } = require ("botbuilder-dialogs");

const CONSUMIDOR_REALIZAR_PEDIDO = "CONSUMIDOR_REALIZAR_PEDIDO";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";
const MAP_PROMPT = "MAP_PROMPT"
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const {convertUrlToLatLong, convertLatLongToUrl}=  require("./formaterUrlGPS")

class ConsumidorRealizarPedidoDialog extends ComponentDialog{
    constructor(){
        super(CONSUMIDOR_REALIZAR_PEDIDO);
        
        this.addDialog(new TextPrompt(MAP_PROMPT,  this.mapPromptValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.solicitarGPS.bind(this),
            this.confirmStep.bind(this),
            this.finalStep.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }
    async solicitarGPS(stepContext) {
        return await stepContext.prompt(MAP_PROMPT, 'Por favor envie su ubicación');
    }
    async confirmStep(stepContext) {
        console.log(stepContext)
        let valueURL = stepContext.values.ubicacion
        if (stepContext.context._activity.channelId == "telegram"){
            valueURL= convertLatLongToUrl(stepContext.context._activity.channelData.message.location.latitude,stepContext.context._activity.channelData.message.location.longitude, '15z')
        }
        stepContext.values.ubicacion = stepContext.result;
        await stepContext.context.sendActivity(valueURL);
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: "Es Correcto?",
            choices:  ChoiceFactory.toChoices(["Si", "No"])
        });
    }

    async finalStep(stepContext){
        if (stepContext.result.value === "Si") {
            console.log(stepContext.values)
            const ubicacion = stepContext.values.ubicacion;
            return await stepContext.endDialog(ubicacion)
        }else{
            await stepContext.context.sendActivity('Ingrese nuevamente');
            return await stepContext.replaceDialog(CONSUMIDOR_REALIZAR_PEDIDO);
        }
    }

    async mapPromptValidator(promptContext) {
        let dataURL= ""
        if (promptContext.context._activity.channelId == "telegram"){
            console.log(promptContext.context._activity.channelData.message.location);
            if (promptContext.context._activity.channelData.message.location == undefined)
                return false;
            dataURL  = convertLatLongToUrl(promptContext.context._activity.channelData.message.location.latitude,promptContext.context._activity.channelData.message.location.longitude, '15z')
        }
        if (promptContext.recognized.succeeded ){
            dataURL = promptContext.recognized.value
        }
        if (promptContext.recognized.succeeded || promptContext.context._activity.channelId == "telegram"){
            console.log(promptContext.recognized.value)
            let map = await convertUrlToLatLong(dataURL)
            console.log(map)
            if (map != null){
                if (map.Lat != null && map.Long != null){
                    return true;
                }else{
                    return false;
                }
            }else{
                return false;
            }
        }else{
            return false;
        }
    }
}
module.exports.ConsumidorRealizarPedidoDialog = ConsumidorRealizarPedidoDialog
module.exports.CONSUMIDOR_REALIZAR_PEDIDO = CONSUMIDOR_REALIZAR_PEDIDO