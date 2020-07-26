const https = require('https');

function convertUrlToLatLong(url) {
    return new Promise((resolve,reject)=> {
        https.get(url, (resp)=> {
            try {
                let location = resp.headers.location;
                let res = location.split("/");
                let found = res.find(element => element.includes("@"));
                let foundSplit = found.split(",")
                console.log(foundSplit)
                resolve(
                    {
                        "Lat": foundSplit[0].replace("@", ""),
                        "Long": foundSplit[1],
                        "zPos": foundSplit[2]
                    }
                )  
            } catch (error) {
                reject (null);
            }

        })
    })
}
async function makeSyncRequest(request, url){
    try {
        let httpPromise = convertUrlToLatLong(url);
        let responseBody = await httpPromise
        console.log(responseBody);
    } catch (error) {
        console.log(error);
    }
}



//     https.get(url, (resp) => {
//         try {
//             var location = resp.headers.location;
//             if (location !== undefined) {
//                 var res = location.split("/");
//                 var found = res.find(element => element.includes("@"));
//                 var foundSplit = found.split(",")
//                 console.log(foundSplit)
//                 gpsData =  {
//                     "Lat": foundSplit[0].replace("@", ""),
//                     "Long": foundSplit[1],
//                     "zPos": foundSplit[2]
//                 }
//                 return gpsData
//             } else {
//                 return `Se recomienda usar Google Maps para compartir ubicaciones`
//             }
//         } catch (error) {
//             return `No se pudo obtener la ubicación`
//         }

//     }).on("error", (err) => {
//         return `No se pudo obtener la ubicación`
//     });

// }


function convertLatLongToUrl(Lat, Long, zPos) {
    // urlGoogle = "https://www.google.com/maps/@-16.5021244,-68.1312175"
    urlGoogle = "https://www.google.com/maps/"
    return `${urlGoogle}@${Lat},${Long},${zPos}`
}

module.exports.convertUrlToLatLong = convertUrlToLatLong
module.exports.makeSyncRequest = makeSyncRequest
module.exports.convertLatLongToUrl = convertLatLongToUrl