import * as userService from '../services/user.service.js'

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's own profile.
 */
export async function getMe(req, res, next) {
    try {
        const profile = await userService.getMyProfile(req.user.sub)
        return res.status(200).json(profile)
    } catch (err) {
        next(err)
    }
}

/**
 * PATCH /api/v1/users/me
 * Body: { first_name?, last_name?, phone?, profile_image? }  [validated by Joi]
 * Updates the authenticated user's own profile.
 */
export async function updateMe(req, res, next) {
    try {
        const updated = await userService.updateMyProfile(req.user.sub, req.body)
        return res.status(200).json(updated)
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/v1/users/:userId
 * Get any user's public profile by UUID.
 * Used by other services (inter-service calls) and admin views.
 */
export async function getUserById(req, res, next) {
    try {
        const user = await userService.getUserById(req.params.userId)
        return res.status(200).json(user)
    } catch (err) {
        next(err)
    }
}

/**
 * GET /api/v1/users/me/addresses
 * Returns all addresses for the authenticated user.
 */
export async function getMyAddresses(req, res, next) {
    try {
        const addresses = await userService.getMyAddresses(req.user.sub)
        return res.status(200).json(addresses)
    } catch (err) {
        next(err)
    }
}

/**
 * POST /api/v1/users/me/addresses
 * Body: address fields  [validated by Joi]
 * Adds a new address for the authenticated user.
 */
export async function addAddress(req, res, next) {
    try {
        const address = await userService.addMyAddress(req.user.sub, req.body)
        return res.status(201).json(address)
    } catch (err) {
        next(err)
    }
}

/**
 * DELETE /api/v1/users/me/addresses/:addressId
 * Removes one of the authenticated user's addresses.
 */
export async function deleteAddress(req, res, next) {
    try {
        await userService.deleteMyAddress(req.user.sub, req.params.addressId)
        return res.status(204).send()
    } catch (err) {
        next(err)
    }
}
