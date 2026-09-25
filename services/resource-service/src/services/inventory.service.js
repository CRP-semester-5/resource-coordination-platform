import * as inventoryRepo from "../repositories/inventory.repository.js";

export const getInventory = async (organizationId) => {
    const { data, error } = await inventoryRepo.getInventoryByOrg(organizationId);
    if (error) throw new Error(error.message);
    return data;
};

export const getTransactions = async (organizationId) => {
    const { data, error } = await inventoryRepo.getTransactionsByOrg(organizationId);
    if (error) throw new Error(error.message);
    return data;
};

export const checkStock = async (organizationId, categoryName, requiredQty) => {
    return await inventoryRepo.checkStockAvailability(organizationId, categoryName, requiredQty);
};

export const increaseInventory = async (organizationId, categoryId, amount, options = {}) => {
    const { data, error } = await inventoryRepo.increaseInventory(organizationId, categoryId, amount, options);
    if (error) throw new Error(error.message);
    return data;
};

export const decreaseInventory = async (organizationId, categoryId, amount, options = {}) => {
    const { data, error } = await inventoryRepo.decreaseInventory(organizationId, categoryId, amount, options);
    if (error) throw new Error(error.message);
    return data;
};

export const restock = async (inventoryId, quantity, userId = null) => {
    const { data: item, error: fetchError } = await inventoryRepo.getById(inventoryId);
    if (fetchError) throw new Error(fetchError.message);
    
    const qty = Math.abs(parseInt(quantity, 10) || 0);
    const newQty = (item.quantity || 0) + qty;
    const { data, error } = await inventoryRepo.updateQuantityById(inventoryId, newQty);
    if (error) throw new Error(error.message);

    // Record Transaction Log
    await inventoryRepo.recordTransaction({
        organizationId: item.organization_id,
        categoryName: 'Warehouse Restock',
        unit: 'items',
        transactionType: 'STOCK_IN',
        quantity: qty,
        referenceType: 'RESTOCK',
        referenceId: inventoryId,
        createdBy: userId,
        remarks: `Manual Restock: Added ${qty} units to warehouse stock`
    });

    return data;
};

export const allocate = async (inventoryId, quantity, requestCode, userId = null) => {
    const { data: item, error: fetchError } = await inventoryRepo.getById(inventoryId);
    if (fetchError) throw new Error(fetchError.message);
    
    const qty = Math.abs(parseInt(quantity, 10) || 0);
    if ((item.quantity || 0) < qty) {
        throw new Error(`Insufficient inventory: Required ${qty}, but only ${item.quantity || 0} in stock.`);
    }

    const { data, error } = await inventoryRepo.updateQuantityById(inventoryId, (item.quantity || 0) - qty);
    if (error) throw new Error(error.message);
    
    // Record Transaction Log
    await inventoryRepo.recordTransaction({
        organizationId: item.organization_id,
        categoryName: 'Aid Allocation',
        unit: 'items',
        transactionType: 'STOCK_OUT',
        quantity: qty,
        referenceType: 'ALLOCATION',
        referenceId: requestCode,
        createdBy: userId,
        remarks: `Manual Allocation: Dispatched ${qty} units for Request ${requestCode || 'Direct Dispatch'}`
    });

    return data;
};
