import { productsService } from '../services/productsService.js';
import { cartsService } from '../services/cartsService.js';
import { ticketsService } from '../services/ticketsService.js';
import { isValidObjectId } from 'mongoose';
import { ticketDTO } from '../DTO/ticketDTO.js';
import { uniqueTicketCode } from '../utils.js';
import { sendEmail } from '../utils.js';
import { UsersManagerMongo as UsersManager } from '../dao/usersManagerMONGO.js';
import { config } from '../config/config.js';
import { CustomError } from "../utils/CustomError.js";
import { invalidCartBody, notFound, notProcessed } from "../utils/errorCauses.js";
import { ERROR_CODES } from "../utils/EErrors.js";
// import { TicketsMongoDAO } from '../dao/ticketsMongoDAO.js';

const usersManager = new UsersManager()

export class CartsController{
    static getCarts=async(req,res)=>{
        res.setHeader('Content-type', 'application/json');    
        try{
            const carts = await cartsService.getCarts() 
            if(!carts){
                return res.status(404).json({
                    error: `ERROR: resource not found`,
                    message: `No carts were found in our database, please try again later`
                })
            }             
            res.status(200).json({payload:carts})
        }catch(error){
            return res.status(500).json({
                error:`Unexpected server error - try again or contact support`,
                message: error.message
            })
        }
    }

    static getCartById=async(req,res)=>{
        const {cid}=req.params
        res.setHeader('Content-type', 'application/json');
    
        if(!isValidObjectId(cid)){
            return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
        }
    
        try {
            const matchingCart = await cartsService.getCartById(cid) 
            if(!matchingCart){
                return res.status(404).json({
                    error: `ERROR: Cart id# provided was not found`,
                    message: `Resource not found: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
                })
            }        
            return res.status(200).json({payload: matchingCart})
        } catch (error) {
            return res.status(500).json({
                error:`Unexpected server error - try again or contact support`,
                message: error.message
            })
        }
    
    }

    static postNewCart=async(req,res)=>{
        res.setHeader('Content-type', 'application/json')
        try {
         
            const newCart = await cartsService.createNewCart()
            if(!newCart){
                return res.status(404).json({
                    error: `ERROR: resource not found - new cart not posted`,
                    message: `Resource not found: the new cart could not be created. Please try again`
                })
            }
            return res.status(200).json({
                newCart
            })
        } catch (error) {
            return res.status(500).json({
                error:`Unexpected server error (500) - try again or contact support`,
                message: error.message
            })
        }
    }

    static replaceCartContent=async(req,res)=>{
        const {cid} = req.params;
        const newCartDetails = req.body
        res.setHeader('Content-type', 'application/json')
    
        if(!isValidObjectId(cid)){
            return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
        }
    
        try{
           
            const cartIsValid = await cartsService.getCartById(cid)
            if(!cartIsValid){
                return res.status(404).json({
                    error: `ERROR: Cart id# provided was not found`,
                    message: `Failed to replace the content in cart due to invalid argument: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
                })
            }
        }catch(error){
            return res.status(500).json({
                error:`Unexpected server error (500) - try again or contact support`,
                message: error.message
            })
        }
      
        const newCartDetailsString = JSON.stringify(newCartDetails)
        const regexValidFormat = /^\[\{.*\}\]$/;
        if(!regexValidFormat.test(newCartDetailsString)){
            return res.status(400).json({
                error: 'Invalid request : Format does not meet criteria',
                message:  `Failed to replace the content in the cart id#${cid} due to invalid format request. Please make sure the products you submit are in a valid JSON format (Alike array with objects: [{...content}]).`
            });
        }
        
        const keys = Object.keys(newCartDetails)
        if(keys.length>0){
            const bodyFormatIsValid = keys.every(key=> 'pid' in newCartDetails[key] && 'qty' in newCartDetails[key])
            if(!bodyFormatIsValid){
                return res.status(400).json({
                    error: 'Missing properties in body',
                    message: `Failed to replace the content in the cart id#${cid} due to incomplete request (missing properties). All products in cart must have a "pid" and a "qty" property to be accepted. Please verify and try again.`
                });
            }
        }
    
        const pidArray = newCartDetails.map(cart=>cart.pid)
        try{
            for(const pid of pidArray){
                const pidIsValid = await productsService.getProductBy({_id:pid})
                if(!pidIsValid){
                    return res.status(404).json({
                        error: `ERROR: Cart could not be replaced`,
                        message: `Failed to replace the content in cart id#${cid}. Product id#${pid} was not found in our database. Please verify and try again`
                    })
                }
            }  
        }catch(error){
            return res.status(500).json({
                error:`Unexpected server error (500) - try again or contact support`,
                message: error.message
            })
        }
     
        
        try{
            const cartEditDetails = await cartsService.replaceProductsInCart(cid,newCartDetails)
            if(!cartEditDetails){
                return res.status(404).json({
                    error: `ERROR: Cart id# could not be replaced`,
                    message: `Failed to replace the content in cart id#${cid}. Please verify and try again`
                })
            }
            return res.status(200).json({
                cartEditDetails
            })
        }catch(error){  
            return res.status(500).json({
                error:`Unexpected server error (500) - try again or contact support`,
                message: error.message
            })
        }
    }

    static updateProductInCart=async(req,res,next)=>{
        const {cid, pid} = req.params
        const {qty} = req.body
        res.setHeader('Content-type', 'application/json');
        
        try{
            if(!isValidObjectId(cid)){
                return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
            }
        
            if(!isValidObjectId(pid)){
                return res.status(400).json({error:`The Product ID# provided is not an accepted Id Format in MONGODB database. Please verify your Product ID# and try again`})
            }
        
            // future improvement: see if can improve/simplify UX logic (eg. allow for null OR [] OR {} to result in +1 instead of error)
            const regexValidBodyFormat = /^\{.*\}$/
            const fullBody = JSON.stringify(req.body)
            if(!regexValidBodyFormat.test(fullBody,pid,cid)){ 
                return next(
                    CustomError.createError(
                        "Invalid Body Format", 
                        invalidCartBody(fullBody),
                        `Qty to increase invalid format`, 
                        ERROR_CODES.INVALID_ARGUMENTS)
                )     
            }

            const productIsValid = await productsService.getProductBy({_id:pid})
            if(!productIsValid){
                return next(CustomError.createError(
                    "Product not found",
                    notFound(pid,"pid"),
                    `pid  #${pid} was not found`, 
                    ERROR_CODES.RESOURCE_NOT_FOUND
                ))
            }
   
            const cartIsValid = await cartsService.getCartById(cid)
            if(!cartIsValid){
                return next(CustomError.createError(
                    "Cart not found",
                    notFound(cid,"cid"),
                    `cid #${cid} was not found`, 
                    ERROR_CODES.RESOURCE_NOT_FOUND
                ))
            }

            //future improvement - seek for better method (change +1 for +N even on first iteration if desired) // needs qty to be updated properly
            const productAlreadyInCart = await cartsService.findProductInCart(cid,pid) 
            if(!productAlreadyInCart){
               const updatedCart =  await cartsService.addProductToCart(cid,pid)
               if(!updatedCart){
                return next(CustomError.createError(
                    "New product was not added to cart",
                    notProcessed(),
                    `Product pid#${pid} could not be added to cart cid#${cid}`,
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                ))
               }
               return res.status(200).json({ updatedCart });
            }

            const updatedCart = await cartsService.updateProductQtyInCart(cid,pid,qty)
            if(!updatedCart){
                return next(CustomError.createError(
                    "Quantity of selected product was not increased in cart",
                    notProcessed(),
                    `Product pid#${pid} could not be increased cart ${cid} by the inteded quantity of ${qty} units. Product remained with original quantity`,
                    ERROR_CODES.INTERNAL_SERVER_ERROR
                ))
            }

            return res.status(200).json({ updatedCart });
        }catch(error){
            next(error)
        }  
  
    }

    static deleteAllProductsInCart=async(req,res)=>{
        const {cid} = req.params
      
        res.setHeader('Content-type', 'application/json');
    
        if(!isValidObjectId(cid)){       
            return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
        }
    
        try {
            const deletedCart = await cartsService.deleteProductsInCart(cid)
            if(!deletedCart){
                return res.status(404).json({
                    error: `ERROR: Cart id# provided was not found`,
                    message: `Failed to delete cart id#${cid} as it was not found in our database, Please verify and try again`
                })
            }       
            return res.status(200).json({
                payload:deletedCart
            })
        } catch (error) {
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
    }

    static deleteSingleProductInCart=async(req,res)=>{
        const {cid, pid} = req.params;
        res.setHeader('Content-type', 'application/json');
    
        if(!isValidObjectId(cid)){
            return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
        }
    
        if(!isValidObjectId(pid)){
            return res.status(400).json({error:`The Product ID# provided is not an accepted Id Format in MONGODB database. Please verify your Product ID# and try again`})
        }
    
        try{
            const isProductIdValid = await productsService.getProductBy({_id:pid})
            if(!isProductIdValid){
                return res.status(404).json({
                    error: `ERROR: Product id# provided was not found`,
                    message: `Failed to delete product id#${pid} in cart. This product id was not found in our database, Please verify and try again`
                })
            }
    
            const isCartIdValid = await cartsService.getCartById(cid)
            if(!isCartIdValid){
                return res.status(404).json({
                    error: `ERROR: Cart id# provided was not found`,
                    message: `Failed to delete intended products in cart id#${cid}. The cart id# provided was not found in our database, Please verify and try again`
                })
            }    
           
            const isProductInCart = await cartsService.findProductInCart(cid,pid)
            if(!isProductInCart){
                return res.status(404).json({
                    error: `ERROR: Product id# was not found in this cartid#`,
                    message: `Failed to delete product id#${pid} in cart id#${cid}. The product id# provided was not found in the selected cart, Please verify and try again`
                })
            }
        }catch(error){
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
    
        try {          
            const deletedProductInCart = await cartsService.deleteProductsInCart(cid,pid)
            if(!deletedProductInCart){
                return res.status(404).json({
                    error: `ERROR: Failed to delete product in cart`,
                    message: `Could not delete product id#${pid} in cart id#${cid}, Please verify and try again`
                })
            }
            return res.status(200).json({
                payload:deletedProductInCart
            })
        } catch (error) {
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
    }

    static completePurchase=async(req,res)=>{
        res.setHeader('Content-type', 'application/json');
        const {cid} =req.params;
        const { email: userEmail, cart: userCart, _id: userId } = req.session.user
        const uniqueCode = uniqueTicketCode(req.session.user)
        let purchasedProducts=[];
        
        if(!isValidObjectId(cid)){
            return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
        }

        if(cid !== userCart._id){
            return res.status(400).json({error:`Purchase Cannot be completed: There is a missmatch between the cart Id referenced in your url (id#${cid}) and the one associated with the user trying to complete the purchase (id#${userCart._id}) Please verify and try again`})
        }

        try{
            const matchingCart = await cartsService.getCartById(cid) 
            const cartId = matchingCart._id.toString()
    
            for(let p of matchingCart.products){
                const productDetails= p.pid
                const productOrderQty = p.qty
                const productId = p.pid._id.toString()
                const productStock=p.pid.stock
                if(productOrderQty<=productStock){
                    const newProductStock = productStock-productOrderQty  
                    const updateProductStock = await productsService.updateProduct(productId,{stock:newProductStock}) 
                    const deleteProductInCart = await cartsService.deleteProductsInCart(cartId,productId)
                    const orderTicket = {...productDetails, qty:productOrderQty}
                    purchasedProducts.push(new ticketDTO(orderTicket))
                }           
            }
    
            const ticketSubtotals = purchasedProducts.map(p=>p.subtotal)
            const ticketTotal = ticketSubtotals.reduce((ticketTotalAcc,subtotal)=>ticketTotalAcc+subtotal,0)
            const remainingCart = await cartsService.getCartById(cartId)       
            const ticketDetails={
                code: uniqueCode,
                purchaser:userEmail,
                amount: ticketTotal,
                productsPurchased:purchasedProducts,
                productsLeftInCart:remainingCart.products.map(p=>p.pid._id),
                carts:userCart,
            }
            
            const ticketCreated = await ticketsService.createTicket(ticketDetails)    
            const ticketUserAssigned = await usersManager.addTicketToUser(userId,ticketCreated._id)
            const emailSent = await sendEmail(
                `BACKEND ECOMM TICKET ${config.GMAIL_EMAIL}`,
                `${userEmail}`,
                `Tu Compra - Ticket#${ticketCreated._id}`,
                `<h2>Muchas Gracias por Tu Compra!</h2>
                 <p>Tu numero de Ticket es #${ticketCreated._id}</p>
                 <p>Tu código único es #${uniqueCode}<p>
                 <p>El total de tu compra fue de $${ticketCreated.amount} USD</p>          
                 <p>Puedes revisar todos los detalles de tu compra la sección de "MI PERFIL" en nuestro sitio web</p>          
                 <br>
                 <h4>Cualquier duda puedes reportarla a nuestro número +52123456789</h4>
                 <br>
                 <h4>Gracias y Sigue comprando con nosotros!!</h4>
                `              
            )
            console.log("emailSent Object",emailSent)
            //nota... siempre acepta el envio -- como manejar el retorno posterior de DNS no encontrado?
            if(emailSent.accepted.length>0){console.log('mail enviado!!')}else{console.log('Hubo un Error, el correo del usuario no aceptó el email enviado')}
            return res.status(200).json({payload:ticketCreated})
        }catch(error){
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }        
    }

    static getPurchaseTicket=async(req,res)=>{
        res.setHeader('Content-type', 'application/json');
        const {cid,tid} =req.params
        const {cart: userCart} = req.session.user

        if(!isValidObjectId(cid)){
            return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
        }

        if(cid !== userCart._id){
            return res.status(400).json({error:`Ticket Cannot be retreived: the ticket id#${tid} does not belong to the user with the cart id#${userCart._id}.Please verify and try again`})
        }

        try {
            const matchingTicket = await ticketsService.getPurchaseTicket({_id:tid})
            return res.status(200).json({payload: matchingTicket})
        } catch (error) {
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
      
    }
    
}