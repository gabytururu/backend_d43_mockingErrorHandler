import { Router } from 'express';
import { passportCallError } from '../utils.js';
import passport from "passport";
import {customAuth} from '../middleware/auth.js'
import { userDTO } from '../DTO/userDTO.js';
import { UsersManagerMongo as UsersManager } from '../dao/usersManagerMONGO.js';

let usersManager = new UsersManager()

export const router=Router();

router.post('/registro',passportCallError("registro"),async(req,res)=>{
    const newUser = {...req.user}
    delete newUser.password

    const acceptHeader = req.headers['accept']
    if(acceptHeader.includes('text/html')){
        return res.status(301).redirect('/login')
    }

    res.setHeader('Content-type', 'application/json');
    return res.status(201).json({
        status:"success",
        message:"Signup process was completed successfully",
        payload:{
            nombre:newUser.nombre,
            email: newUser.email,
            rol: newUser.rol,
            carrito: newUser.cart
        }
    })
})

router.post('/login',passportCallError("login"),async(req,res)=>{
    const authenticatedUser ={...req.user}
    delete authenticatedUser.password
    req.session.user = authenticatedUser    
    
    const acceptHeader = req.headers['accept']
    if(acceptHeader.includes('text/html')){
        return res.status(301).redirect('/products')
    }

    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({
        status: 'success',
        message: 'User login was completed successfully',
        payload: {
            nombre: authenticatedUser.first_name,
            apellido: authenticatedUser.last_name,
            edad: authenticatedUser.age,
            email: authenticatedUser.email,
            rol:authenticatedUser.rol,
            carrito:authenticatedUser.cart
        }
    })      
})

router.get('/current', customAuth(["user"]), async(req,res)=>{
   // const currentUser = req.session.user
    //console.log('el current user original',currentUser)
    const currentUserDTO = new userDTO(req.session.user)
    // console.log('el current user Con DTO',currentUserDTO)

    const acceptHeader = req.headers['accept']
    if(acceptHeader.includes('text/html')){
        return res.status(301).redirect('/perfil')
    }

    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({
        status:'success',
        message: 'current user was obtained successfully',
        // payload:{
        //     nombre: currentUser.first_name,
        //     apellido: currentUser.last_name,
        //     edad: currentUser.age,
        //     email: currentUser.email,
        //     rol:currentUser.rol,
        //     carrito:currentUser.cart
        // }    
        payload:{
            // nombre: currentUser.first_name,
            // apellido: currentUser.last_name,
            fullName:currentUserDTO.fullName,
            email: currentUserDTO.email,
            cart:currentUserDTO.cart
            // edad: currentUser.age,
            // email: currentUser.email,
            // rol:currentUser.rol,
            // carrito:currentUser.cart
        }    
    })
})

router.get('/users/:uid', customAuth(["public"]), async(req,res)=>{
    const { uid } = req.params

    const singleUser = await usersManager.getUserByFilter({_id:uid})
    
    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({payload:singleUser})
})

router.get('/users', customAuth(["public"]), async(req,res)=>{
    
    const allUsers = await usersManager.getAllUsers()

    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({payload:allUsers})
})

router.put('/users/:uid/:orderTicket',customAuth(["user"]),async(req,res)=>{
    const {uid,orderTicket} =req.params   
    const updatedUser = await usersManager.addTicketToUser(uid,orderTicket)
    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({payload:updatedUser})    
})

router.get('/logout', customAuth(["user","admin"]),async(req,res)=>{
    req.session.destroy(error=>{
        if(error){
            res.setHeader('Content-type', 'application/json');
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
    })

    const acceptHeader = req.headers['accept']
    if(acceptHeader.includes('text/html')){
        return res.status(301).redirect('/logout')
    }

    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({payload:'Logout Exitoso'})
})

router.get('/error',(req,res)=>{
    res.setHeader('Content-type', 'application/json');
    return res.status(500).json({
        error:`Error 500 Server failed unexpectedly, please try again later`,
        message: `Fallo al autenticar`
    })
})

router.get('/github',passport.authenticate("github",{}),(req,res)=>{})

router.get('/callbackGithub',passport.authenticate("github",{failureMessage:true,failureRedirect:"/api/sessions/error"}),(req,res)=>{
    const githubAuthenticatedUser = {...req.user}
    delete githubAuthenticatedUser.profile
    req.session.user = req.user

    const acceptHeader = req.headers['accept']
    if(acceptHeader.includes('text/html')){
        return res.status(301).redirect('/products')
    }

    res.setHeader('Content-type', 'application/json');
    return res.status(200).json({
        status:'success',
        message:'Github Authentication was completed successfully',
        payload:{
            nombre: githubAuthenticatedUser.nombre,
            email: githubAuthenticatedUser.email,
            rol: githubAuthenticatedUser.rol,
            carrito: githubAuthenticatedUser.cart,
        }
    })
})
