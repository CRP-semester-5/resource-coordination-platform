import * as feedService from "../services/feed.service.js";

export const getFeed = async (req, res, next) => {
    try {
        const { type, status, limit, offset } = req.query;
        const posts = await feedService.getFeed({
            type,
            status,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0,
        });
        return res.json({ success: true, data: posts });
    } catch (error) {
        next(error);
    }
};

export const createMessage = async (req, res, next) => {
    try {
        const orgIdFromHeader = req.headers["x-organization-id"];
        const body = {
            ...req.body,
            organization_id: req.body.organization_id || orgIdFromHeader || null,
        };
        const message = await feedService.createMessage(body, req.user);
        return res.status(201).json({ success: true, data: message });
    } catch (error) {
        next(error);
    }
};

export const toggleReaction = async (req, res, next) => {
    try {
        const messageId = req.params.id;
        const { emoji } = req.body;
        const updated = await feedService.toggleReaction(messageId, emoji, req.user.sub);
        return res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const messageId = req.params.id;
        const { status } = req.body;
        const updated = await feedService.updateStatus(messageId, status);
        return res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

export const deleteMessage = async (req, res, next) => {
    try {
        const messageId = req.params.id;
        await feedService.deleteMessage(messageId, req.user);
        return res.json({ success: true, message: "Message deleted" });
    } catch (error) {
        next(error);
    }
};
