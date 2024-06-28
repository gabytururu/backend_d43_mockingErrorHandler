
export const customAuth=(permisos=[])=>{
    return (req,res,next)=>{
        permisos = permisos.map(p=>p.toLowerCase())
        if(permisos.includes("public")){
            return next()
        } 
        if(!req.session.user){
            res.setHeader('Content-type', 'application/json');
            return res.status(401).json({
                error:`Invalid credentials - no authenticated users were found.`,
            })
        }
        if(!permisos.includes(req.session.user.rol.toLowerCase())){
            res.setHeader('Content-Type','application/json');
            return res.status(403).json({
                error:`Invalid credentials - insufficient privileges to access this resource.`,
            })
        }
        return next()
    }
}
