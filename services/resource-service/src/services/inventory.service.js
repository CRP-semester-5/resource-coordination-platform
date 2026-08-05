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
