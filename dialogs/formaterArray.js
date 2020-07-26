function formaterTextOptions(array){
    var visualText = ""
    array.forEach((item,idx) => {visualText = visualText + `🔹${idx+1}. ${item}\n\n`});
    return visualText
}

module.exports.formaterTextOptions= formaterTextOptions