import { Router } from 'express';
import { CartsController } from '../controller/cartsController.js';
import {customAuth} from '../middleware/auth.js'
export const router=Router();


router.get('/',customAuth(["admin"]),CartsController.getCarts)
router.get('/:cid',customAuth(["user"]),CartsController.getCartById)
router.post('/',customAuth(["user"]),CartsController.postNewCart)
router.put('/:cid',customAuth(["user"]),CartsController.replaceCartContent)
router.put('/:cid/products/:pid',customAuth(["user"]),CartsController.updateProductInCart)
router.delete('/:cid',customAuth(["user"]), CartsController.deleteAllProductsInCart)
router.delete('/:cid/products/:pid',customAuth(["user"]),CartsController.deleteSingleProductInCart )
router.post('/:cid/purchase',customAuth(["user"]),CartsController.completePurchase)
router.get('/:cid/purchase/:tid',customAuth(["user","admin"]),CartsController.getPurchaseTicket)

