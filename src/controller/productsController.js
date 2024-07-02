import { productsService } from "../services/productsService.js";
import { isValidObjectId } from 'mongoose';
import { CustomError } from "../utils/CustomError.js";
import { postMissingProperty, duplicatedCode, notFound } from "../utils/errorCauses.js";
import { ERROR_CODES } from "../utils/EErrors.js";

export class ProductsController{
    static getProducts=async(req,res)=>{
        let {pagina, limit, sort, ...query}=req.query; 
        res.setHeader('Content-type', 'application/json');
    
        if (!pagina) pagina=1;
        if (!limit) limit=10;
        if (sort) sort= {price:sort};
        if (query.category) query.category = query.category;
        if (query.stock === "disponible") query.stock = { $gt: 0 };
       
        try{            
            const {docs,totalPages,prevPage,nextPage,page,hasPrevPage,hasNextPage}= await productsService.getProducts(query,{pagina, limit, sort});
            return res.status(200).json({
                status: 'success',
                payload:docs,
                totalPages,
                prevPage,
                nextPage,
                page,
                hasPrevPage,
                hasNextPage,
                prevLink: hasPrevPage ? `localhost:8080/api/products?pagina=${prevPage}` : 'No previous page available',
                nextLink: hasNextPage ? `localhost:8080/api/products?pagina=${nextPage}` : 'No next page available'
            });
        }catch(error){
            return res.status(500).json({
                status: 'Error',
                error:`Unexpected server error - try again or contact support`,
                message: error.message
            })
        }    
    }

    static getProductById=async(req,res,next)=>{
        const id = req.params.id
        res.setHeader('Content-type', 'application/json'); 
       
        if(!isValidObjectId(id)){        
            return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
        }
    
        try{          
            const matchingProduct = await productsService.getProductBy({_id:id})
            if(!matchingProduct){         
                return next(CustomError.createError(
                    "Resource not found", 
                    notFound(id), 
                    `Element tied to reference #${id} was not found`, 
                    ERROR_CODES.RESOURCE_NOT_FOUND
                ))               
            }
              
            return res.status(200).json({payload: matchingProduct})
        }catch(error){
            next(error)
        }
    }

    static postProduct=async(req, res, next)=>{
        const {title, description, code, price, stock,category,thumbnails} = req.body
        res.setHeader('Content-type', 'application/json');
    
        const prodToPost = {
            title: title,
            description: description,
            code: code,
            price: price,
            status: true,
            stock: stock,
            category: category || 'tbd',
            thumbnails: thumbnails || 'tbd'
        }
    
        for(const property in prodToPost){
                if(prodToPost[property] === undefined){ 
                    try{
                        CustomError.createError("Missing Properties", postMissingProperty(prodToPost),`Property ${property} is missing`, ERROR_CODES.INVALID_ARGUMENTS)
                    }catch(error){
                        return next(error)
                    }                   
                }            
        }  
        
        try{
            const duplicateCode = await productsService.getProductBy({code: code})
            if(duplicateCode){
                CustomError.createError("Duplicate Code", duplicatedCode(code),`Code ${code} is already registered and cannot be duplicated`, ERROR_CODES.INVALID_ARGUMENTS)
            }
        }catch(error){
            return next (error)
        }
    
        try{         
            const newProduct = await productsService.postNewProduct(prodToPost)
            return res.status(200).json({
                payload: newProduct
            })
        }catch(error){
            return res.status(500).json({
                error:`Error - Server failed, please try again later`,
                message: error.message
            })
        }    
    }

    static updateProduct=async(req,res)=>{
        const {id} = req.params
        const propsToUpdate = req.body 
        res.setHeader('Content-type', 'application/json');
    
        if(!isValidObjectId(id)){
            return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
        }
    
        try{           
            const matchingProduct = await productsService.getProductBy({_id:id})
            if(!matchingProduct){
                return res.status(404).json({
                    error: `Failed to complete product update: the product you are trying to modify (product with ID#${id}) was not found in our database. Please verify your ID# and try again`,                
                })
            }
        }catch(error){
            return res.status(500).json({
                error:`Error - Server failed, please try again later`,
                message: error.message
            })
        }   
        
        if(propsToUpdate._id){
            return res.status(400).json({
                error:`Error: product not updated`,
                message: `Failed to update the product with id#${id} due to invalid argument. The property "_id" cannot be modified. Please verify and try again`
            })
        }
    
        if(propsToUpdate.code){
            try {               
                const duplicateCode = await productsService.getProductBy({_id:{$ne:id}, code: propsToUpdate.code})
                if(duplicateCode){
                    return res.status(400).json({
                        error:`Error: product not updated`,
                        message:`Failed to update product with id#${id} due to invalid argument: The "code" property cannot be updated/changed to a previously existent code in our database. Please verify and try again with a different code#`
                    })
                }
            } catch (error) {
                return res.status(500).json({
                    error:`Error - Server failed, please try again later`,
                    message: error.message
                })
            }
        }
    
    
        try {           
            let updatedProduct = await productsService.updateProduct(id,propsToUpdate)
            return res.status(200).json({payload:updatedProduct})
        } catch (error) {
            return res.status(500).json({
                error:`Error - Server failed, please try again later`,
                message:error.message
            })
        }
    }

    static deleteProduct=async(req,res)=>{
        const {id} = req.params
        res.setHeader('Content-type', 'application/json');
    
        if(!isValidObjectId(id)){
            return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
        }
    
        try {        
            let deletedProduct = await productsService.deleteProduct(id)
            if(!deletedProduct){
                return res.status(404).json({
                    error: `Failed to delete product: the product you are trying to delete (ID#${id}) was not found in our database. Please verify your ID# and try again`,                
                })
            }
            return res.status(200).json({
                payload:deletedProduct
            })
        } catch (error) {
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
    }
}