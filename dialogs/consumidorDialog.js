const { ComponentDialog,NumberPrompt,TextPrompt,WaterfallDialog, ChoicePrompt } = require ("botbuilder-dialogs");
// const { UserProfile } = require('../models/userProfile');

const CONSUMIDOR_DIALOG = "CONSUMIDOR_DIALOG";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";
// const TEXT_PROMT = "TEXT_PROMPT"
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const { ConsumidorRealizarPedidoDialog, CONSUMIDOR_REALIZAR_PEDIDO } = require("./consumidorRealizarPedidoDialog")
const { formaterTextOptions } =require ("./formaterArray");
class ConsumidorDialog extends ComponentDialog{
    constructor()
    {
        super(CONSUMIDOR_DIALOG);

        this.tipoConsumidor = ['Familiar', 'Gastronomico'];
        this.menuPedidos = ['Realizar Pedido', 'Ver Pedidos'];

        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConsumidorRealizarPedidoDialog());
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.tipoConsumidorStep.bind(this),
            this.menuDeConsumidor.bind(this),
            this.finishConsumidorDialog.bind(this),
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }
    async tipoConsumidorStep(stepContext){
        const options = this.tipoConsumidor.slice();
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: `¿Qué consumidor es? \n\n ${formaterTextOptions(this.tipoConsumidor)}` ,
            retryPrompt: 'Por favor seleccione uno de los dos tipos',
            choices: options
        });
    }
    async menuDeConsumidor(stepContext){
        stepContext.values.tipoConsumidor = stepContext.result.value;
        const options= this.menuPedidos.slice();
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: `¿Qué desea realizar? \n\n ${formaterTextOptions(this.menuPedidos)}` ,
            retryPrompt: 'Por favor seleccione uno de los dos tipos',
            choices: options
        });
    }
    async finishConsumidorDialog(stepContext){
        stepContext.result.value;
        console.log(stepContext.result.value)
        switch(stepContext.result.value){
            case "Ver Pedidos":
                await stepContext.context.sendActivity('Módulo del proveedor en desarrollo');
                return await stepContext.next()
            case "Realizar Pedido":
                return await stepContext.beginDialog(CONSUMIDOR_REALIZAR_PEDIDO);
        }
        console.log(stepContext.result)
        const tipoConsumidor = stepContext.values.tipoConsumidor;
        return await stepContext.endDialog(tipoConsumidor)
    }
}


module.exports.ConsumidorDialog = ConsumidorDialog;
module.exports.CONSUMIDOR_DIALOG = CONSUMIDOR_DIALOG;