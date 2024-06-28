import { Router } from 'express';
import { VistasController } from '../controller/vistasController.js';
import { customAuth } from '../middleware/auth.js';
export const router=Router();


//mocking proucts endpoint
router.get('/mockingProducts',customAuth(["public"]),VistasController.getMockingProducts)


//real ecommerce API endpoints
router.get('/',customAuth(["public"]),VistasController.renderHome)
router.get('/products',customAuth(["public"]),VistasController.renderProducts)
router.get('/products/:pid',customAuth(["public"]),VistasController.renderProductById)
router.get('/carts',customAuth(["admin"]),VistasController.renderCarts)
router.get('/carts/:cid',customAuth(["user","admin"]),VistasController.renderCartById)
router.get('/chat',customAuth(["user"]),VistasController.renderChat)
router.get('/registro', customAuth(["public"]),VistasController.renderRegistro)
router.get('/login',customAuth(["public"]),VistasController.renderLogin)
router.get('/perfil',customAuth(["user","admin"]),VistasController.renderPerfil)
router.get('/logout',customAuth(["public"]),VistasController.renderLogout)
router.get('/purchase/:tid',customAuth(["user","admin"]),VistasController.renderTicket)



