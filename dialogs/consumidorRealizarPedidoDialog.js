const { MessageFactory } = require('botbuilder');
const { ComponentDialog,TextPrompt,WaterfallDialog, ChoicePrompt, ChoiceFactory } = require ("botbuilder-dialogs");
const { CardFactory } = require('botbuilder');
const CONSUMIDOR_REALIZAR_PEDIDO = "CONSUMIDOR_REALIZAR_PEDIDO";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";
const MAP_PROMPT = "MAP_PROMPT"
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const {convertUrlToLatLong, convertLatLongToUrl}=  require("./formaterUrlGPS")
const {formaterTextOptions, formaterTextOptionsPedido} = require ("./formaterArray")

let categorias = ["Lacteos", "Verduras", "Bolsas"]
let productosXCategorias = 
{
    "Lacteos": [
		{
			"id" : "1",
            "name" : "Leche",
            "unidad": "1L",
			"precio" : 15,
			"img" : "https://www.pikpng.com/pngl/m/49-498500_brick-de-leche-png-clipart.png"
		},
		{
			"id" : "2",
            "name" : "Queso",
            "unidad": "1U",
			"precio" : 20,
			"img" : "https://img.freepik.com/foto-gratis/close-up-delicioso-queso-tradicional_23-2148430195.jpg?size=626&ext=jpg"
		}
    ],
    "Verduras" : [
		{
			"id" : "3",
			"name" : "Toamte",
            "unidad": "5U",
			"precio" : 5,
			"img" : "https://frutasyverduras.info/wp-content/uploads/2019/07/tomate-1024x680.jpg"
		}
    ],
    "Bolsas" : [
		{
			"id" : "4",
            "name" : "Surtido",
            "unidad": "1U",
			"precio" : 50,
			"img" : "https://previews.123rf.com/images/lucaph/lucaph1507/lucaph150700030/43541007-verduras-conservadas-en-bolsas-de-celof%C3%A1n-para-alimentos.jpg"
		}
	]
}
class ConsumidorRealizarPedidoDialog extends ComponentDialog{
    constructor(){
        super(CONSUMIDOR_REALIZAR_PEDIDO);
        
        this.addDialog(new TextPrompt(MAP_PROMPT,  this.mapPromptValidator));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.solicitarGPS.bind(this),
            this.confirmStep.bind(this),
            this.selecionarCategoria.bind(this),
            this.productosDisponibles.bind(this),
            this.confirmStepProduct.bind(this),
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

    async selecionarCategoria(stepContext){
        if (stepContext.result.value === "Si") {

            // let categorias = ["Lacteos", "Verduras", "Bolsas"]
            return await stepContext.prompt(CHOICE_PROMPT, {
                prompt: `¿Seleccione una categoria? \n\n ${formaterTextOptions(categorias)}` ,
                retryPrompt: 'Por favor seleccione una categoria de las mostradas',
                choices: categorias
            });

        }else{
            await stepContext.context.sendActivity('Ingrese nuevamente');
            return await stepContext.replaceDialog(CONSUMIDOR_REALIZAR_PEDIDO);
        }
    }

    async productosDisponibles(stepContext){
        stepContext.values.selectedCategoria = stepContext.result.value;
        let productosCat = productosXCategorias[stepContext.result.value]
        let products = formaterTextOptionsPedido(productosCat);
        // products.forEach(element => {

        //     const card = CardFactory.heroCard(
        //         'White T-Shirt',
        //         ['https://example.com/whiteShirt.jpg'],
        //         ['buy']
        //     );
        //     const message = MessageFactory.attachment(card);
        //             await stepContext.context.sendActivity(item.name);
        //         });

        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: `¿Seleccione una producto a pedir? \n\n ${products.textOptions}` ,
            retryPrompt: 'Por favor seleccione una categoria de las mostradas',
            choices: products.options
        });
    }

    async confirmStepProduct(stepContext) {
        stepContext.values.pedido = stepContext.result.value
        await stepContext.context.sendActivity(`Usted Ordeno ${stepContext.values.pedido}`);
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