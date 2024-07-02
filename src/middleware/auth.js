import { CustomError } from "../utils/CustomError.js";
import { authentication, authorization } from "../utils/errorCauses.js";
import { ERROR_CODES } from "../utils/EErrors.js";

export const customAuth=(permisos=[])=>{
    return (req,res,next)=>{
        permisos = permisos.map(p=>p.toLowerCase())
        if(permisos.includes("public")){
            return next()
        } 
        if(!req.session.user){
            return next(
                CustomError.createError(
                    "Authentication failed",
                    authentication(),
                    "A valid user must be registered and logged in to proceed",
                    ERROR_CODES.AUTENTICATION                    
                )
            )
            // res.setHeader('Content-type', 'application/json');
            // return res.status(401).json({
            //     error:`Invalid credentials - no authenticated users were found.`,
            // })
        }
        if(!permisos.includes(req.session.user.rol.toLowerCase())){
            // res.setHeader('Content-Type','application/json');
            // return res.status(403).json({
            //     error:`Invalid credentials - insufficient privileges to access this resource.`,
            // })
            return next(
                CustomError.createError(
                    "Authorization failed",
                    authorization(),
                    "Content is restricted to users with privileges",
                    ERROR_CODES.AUTHORIZATION                    
                )
            )
        }
        return next()
    }
}
