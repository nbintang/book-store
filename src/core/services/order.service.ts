import { Request, Response } from "express";
import {
  createOrder,
  deleteOrderById,
  findOrderBookByUserId,
  findOrderById,
  updateOrderById,
} from "../repositories/orders.repository";
import { handleErrorResponse } from "../../helper/error-response";
import { RequestWithPayload } from "../../types";
import { getBooksByIds } from "../repositories/books.repository";
import { OrderProps } from "../../types/order";
import {
  countInsufficientStock,
  countTotalPrice,
} from "../../helper/count-price";

export async function getOrderByUserId(req: Request, res: Response) {
  const userId = req.query.userId as string;
  if(!userId) return handleErrorResponse(res, new Error("User id not found"));
  const order = await findOrderBookByUserId(Number(userId));
  res.status(200).json({ success: true, data: order });
}

export async function postOrder(req: Request, res: Response) {
  const items: OrderProps[] = req.body.items;
  if (!items || !Array.isArray(items)) {
    return handleErrorResponse(res, new Error("Invalid items"), 400);
  }

  const userId = (req as RequestWithPayload).id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const books = await getBooksByIds(items.map((item) => item.bookId));
    if (books.length !== items.length) {
      throw new Error("Some books were not found");
    }

    const insufficientStock = await countInsufficientStock(items, books);
    if (insufficientStock) {
      throw new Error(`Insufficient stock for id:${insufficientStock.bookId}`);
    }
    const totalPrice = await countTotalPrice(items, books);
    const result = await createOrder({
      items,
      userId: Number(userId),
      totalPrice,
    });

    res
      .status(201)
      .json({ success: true, message: "Order created", data: result });
  } catch (error) {
    return handleErrorResponse(res, error as Error);
  }
}

export async function patchOrder(req: Request, res: Response) {
  const id = Number(req.params.id);
  const items: OrderProps[] = req.body.items;
  if (!items || !Array.isArray(items)) {
    return handleErrorResponse(res, new Error("Invalid items"), 400);
  }

  const userId = (req as RequestWithPayload).id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  try {
    const books = await getBooksByIds(items.map((item) => item.bookId));
    if (books.length !== items.length) {
      throw new Error("Some books were not found");
    }

    const insufficientStock = await countInsufficientStock(items, books);
    if (insufficientStock) {
      throw new Error(`Insufficient stock for id:${insufficientStock.bookId}`);
    }
    const totalPrice = await countTotalPrice(items, books);
    const result = await updateOrderById({
      id,
      items,
      userId: Number(userId),
      totalPrice,
    });
    res
      .status(201)
      .json({ success: true, message: "Order updated", data: result });
  } catch (error) {
    return handleErrorResponse(res, error as Error);
  }
}

export async function removeOrder(req: Request, res: Response) {
  const { id } = req.params;
  const existedOrder = await findOrderById(Number(id));
  if (!existedOrder) {
    return handleErrorResponse(res, new Error("Order not found"), 404);
  }
  await deleteOrderById(existedOrder.id);
  res.status(200).json({ success: true, message: "Order deleted" });
}
