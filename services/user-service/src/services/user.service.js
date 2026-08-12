import * as userRepo from '../repositaries/user.repository.js'

/**
 * Get the authenticated user's own full profile.
 */
export async function getMyProfile(userId) {
    const user = await userRepo.findUserById(userId)
    
    // Fetch global roles
    const globalRoles = await userRepo.findUserGlobalRoles(userId)
    
    // Fetch org roles
    const orgMemberships = await userRepo.findUserOrgMemberships(userId)
    const orgRoles = orgMemberships.map(m => m.role)
    
    // Combine unique roles
    const roles = [...new Set([...globalRoles, ...orgRoles])]
    
    return { ...user, roles }
}

/**
 * Update the authenticated user's own profile.
 * Only allowed fields: first_name, last_name, phone, profile_image.
 */
export async function updateMyProfile(userId, fields) {
    // Whitelist the fields that users are allowed to update themselves
    const allowed = ['first_name', 'last_name', 'phone', 'profile_image']
    const update = {}
    for (const key of allowed) {
        if (key in fields) update[key] = fields[key]
    }

    if (Object.keys(update).length === 0) {
        const err = new Error('No valid fields provided for update')
        err.status = 400
        throw err
    }

    return userRepo.updateUser(userId, update)
}

/**
 * Get a user by ID.
 * Used by protected endpoints (inter-service lookups and admin views).
 */
export async function getUserById(userId) {
    const user = await userRepo.findUserById(userId)
    if (!user) {
        const err = new Error('User not found')
        err.status = 404
        throw err
    }
    return user
}

/**
 * Get all addresses for the authenticated user.
 */
export async function getMyAddresses(userId) {
    return userRepo.findUserAddresses(userId)
}

/**
 * Add a new address for the authenticated user.
 */
export async function addMyAddress(userId, fields) {
    return userRepo.createAddress(userId, fields)
}

/**
 * Delete one of the authenticated user's addresses.
 * The repository enforces that the address belongs to the user (double-key delete).
 */
export async function deleteMyAddress(userId, addressId) {
    await userRepo.deleteAddress(addressId, userId)
}
