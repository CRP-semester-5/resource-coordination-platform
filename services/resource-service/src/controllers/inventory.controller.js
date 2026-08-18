import * as inventoryService from "../services/inventory.service.js";

export const getInventory = async (req, res, next) => {
    try {
        const organizationId = req.headers["x-organization-id"];
        if (!organizationId) {
            return res.status(400).json({ success: false, message: "Missing x-organization-id header" });
        }
        
        const inventory = await inventoryService.getInventory(organizationId);
        return res.json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

export const addInventory = async (req, res, next) => {
    try {
        const organizationId = req.headers["x-organization-id"];
        if (!organizationId) {
            return res.status(400).json({ success: false, message: "Missing x-organization-id header" });
        }
        
        const { category_id, quantity } = req.body;
        if (!category_id || quantity === undefined) {
            return res.status(400).json({ success: false, message: "Missing category_id or quantity" });
        }
        
        const result = await inventoryService.increaseInventory(organizationId, category_id, quantity);
        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const restock = async (req, res, next) => {
    try {
        const result = await inventoryService.restock(req.params.id, req.body.quantity);
        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const allocate = async (req, res, next) => {
    try {
        const result = await inventoryService.allocate(req.params.id, req.body.quantity, req.body.request_code);
        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
