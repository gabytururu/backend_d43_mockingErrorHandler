import fs from "fs"
import path from "path"
import os from "os"
import util from "util"
import { ERROR_CODES } from "../utils/EErrors.js";
import __dirname from '../utils.js'

  

export const errorHandler=async(error,req,res,next)=>{
    const errorLogUrl= path.join(__dirname,'errors','errorlog.json')
    const errorReason= error.cause?error.cause:error.message
    const fullError = error
   
    const errorDetails = {
        code:error.code,
        type: error.name,
        msg: error.message,
        date: new Date().toUTCString(),
        user: os.userInfo().username,
        terminal: os.hostname(),
        details: error.cause
    }

    console.log(`New Error Registered. Identified Cause: ${util.inspect(errorDetails,{ depth: null, colors: false, breakLength: 80 })}`)

    let errorLog =[]
    if(fs.existsSync(errorLogUrl)){
        errorLog = JSON.parse(await fs.promises.readFile(errorLogUrl,'utf-8'))
        errorDetails.id = errorLog[errorLog.length - 1].id + 1
    }else{
        errorDetails.id = 1
    }
    
    errorLog.push(errorDetails)
    await fs.promises.writeFile(errorLogUrl,JSON.stringify(errorLog, null, 2))     

    switch(error.code){
        case ERROR_CODES.INVALID_ARGUMENTS:
            res.setHeader('Content-type', 'application/json');
            return res.status(400).json({
                code: `Error: ${ERROR_CODES.INVALID_ARGUMENTS}`,
                error:`Cause: Invalid or Missing Arguments`,
                type: `${error.name}`,
                message: `${error.message}`,
                
            })
        case ERROR_CODES.AUTENTICATION: 
            res.setHeader('Content-type', 'application/json');
            return res.status(401).json({
                code: `Error: ${ERROR_CODES.AUTENTICATION}`,
                error:`Cause: Authentication required`,
                type: `${error.name}`,
                message: `${error.message}`,
            })
        case ERROR_CODES.AUTHORIZATION: 
        res.setHeader('Content-type', 'application/json');
        return res.status(403).json({
            code: `Error: ${ERROR_CODES.AUTHORIZATION}`,
            error:`Cause: Forbidden, user lacks access rights to the requested content`,
            type: `${error.name}`,
            message: `${error.message}`,
        })
        case ERROR_CODES.RESOURCE_NOT_FOUND: 
        res.setHeader('Content-type', 'application/json');
        return res.status(404).json({
            code: `Error: ${ERROR_CODES.RESOURCE_NOT_FOUND}`,
            error:`Cause: Requested resource was not found`,
            type: `${error.name}`,
            message: `${error.message}`,
        })
        case ERROR_CODES.INTERNAL_SERVER_ERROR: 
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            code: `Error: ${ERROR_CODES.INTERNAL_SERVER_ERROR}`,
            error:`Cause: Internal error- server failed`,
            type: `${error.name}`,
            message: `${error.message}`,
        })
        default:
            res.setHeader('Content-type', 'application/json');
            return res.status(500).json({
                code: `Error: ${ERROR_CODES.INTERNAL_SERVER_ERROR}`,
                error:`Cause: Internal error- server failed`,
                type: `${error.name}`,
                message: `${error.message}`,
            })

    }
}