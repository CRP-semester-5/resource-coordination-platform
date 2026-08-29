import * as inventoryRepo from "../repositories/inventory.repository.js";

export const getInventory = async (organizationId) => {
    const { data, error } = await inventoryRepo.getInventoryByOrg(organizationId);
    if (error) throw new Error(error.message);
    return data;
};

export const increaseInventory = async (organizationId, categoryId, amount) => {
    const { data, error } = await inventoryRepo.increaseInventory(organizationId, categoryId, amount);
    if (error) throw new Error(error.message);
    return data;
};

export const decreaseInventory = async (organizationId, categoryId, amount) => {
    const { data, error } = await inventoryRepo.decreaseInventory(organizationId, categoryId, amount);
    if (error) throw new Error(error.message);
    return data;
};

export const restock = async (inventoryId, quantity) => {
    const { data: item, error: fetchError } = await inventoryRepo.getById(inventoryId);
    if (fetchError) throw new Error(fetchError.message);
    
    const { data, error } = await inventoryRepo.updateQuantityById(inventoryId, item.quantity + quantity);
    if (error) throw new Error(error.message);
    return data;
};

export const allocate = async (inventoryId, quantity, requestCode) => {
    const { data: item, error: fetchError } = await inventoryRepo.getById(inventoryId);
    if (fetchError) throw new Error(fetchError.message);
    
    if (item.quantity < quantity) {
        throw new Error("Insufficient inventory");
    }

    const { data, error } = await inventoryRepo.updateQuantityById(inventoryId, item.quantity - quantity);
    if (error) throw new Error(error.message);
    
    // In a real system, you would also save the allocation history and link to requestCode.
    return data;
};
