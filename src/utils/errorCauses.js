import os from "os";

export function productPostArguments(product){
    let{title, description, code,price,stock,category,thumbnails}=product

    return `
        Invalid arguments when attempting to post new product.
        Mandatory Arguments:
            - title: type string. Received ${title}, type: ${typeof title}
            - description: type string. Received ${description}, type: ${typeof name}
            - code: type string. Received ${code}, type: ${typeof code}
            - price: type string. Received ${price}, type: ${typeof price}
            - stock: type string. Received ${stock}, type: ${typeof stock}
        Optional Arguments:
            - category: type string. Received ${category}, type: ${typeof category}
            - thumbnails: type string. Received ${thumbnails}, type: ${typeof stock}
        Error Log Details: 
            - Error Date:${new Date().toUTCString()}
            - Error User:${os.userInfo().username}
            - Error Terminal:${os.hostname()}
    `
}


// return `
// Se han detectado argumentos inválidos:
// Argumentos Obligatorios:
//     -name: tipo string. Se recibió ${name}, ${typeof name}
// Argumentos Opcionales:
//     -alias, powers, team, publisher. Se recibió: ${JSON.stringify(otros)}
// Fecha: ${new Date().toUTCString()}
// Usuario: ${os.userInfo().username}
// Terminal: ${os.hostname()}           

// `