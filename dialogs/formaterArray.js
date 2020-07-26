function formaterTextOptions(array){
    var visualText = ""
    array.forEach((item,idx) => {visualText = visualText + `🔹${idx+1}. ${item}\n\n`});
    return visualText
}
function formaterTextOptionsPedido(array){
    options= []
    array.forEach(element => {
        options.push(element.name)
    });
    return {options: options, textOptions: formaterTextOptions(options)}
}

module.exports.formaterTextOptions= formaterTextOptions
module.exports.formaterTextOptionsPedido= formaterTextOptionsPedido