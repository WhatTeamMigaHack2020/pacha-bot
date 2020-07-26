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
        console.log(stepContext.result)
        stepContext.values.ubicacion = stepContext.result;
        await stepContext.context.sendActivity(stepContext.values.ubicacion);
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
            return await stepContext.endDialog();
        }
    }

    async mapPromptValidator(promptContext) {
        // This condition is our validation rule. You can also change the value at this point.
        if (promptContext.recognized.succeeded){
            console.log(promptContext.recognized.value)
            let map = await convertUrlToLatLong(promptContext.recognized.value)
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