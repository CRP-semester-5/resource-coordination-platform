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
