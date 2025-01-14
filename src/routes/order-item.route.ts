import { Router } from "express"
import { deleteOrderItem, getOrderItemById } from "../core/services/order-item.service"

const route = Router()

route.get("/:id", getOrderItemById);
route.delete("/:id", deleteOrderItem);



export { route as orderItemRoute }