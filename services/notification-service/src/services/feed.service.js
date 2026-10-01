import * as feedRepo from "../repositories/feed.repository.js";
import { supabase } from "../lib/supabase.js";
import { AppError } from "@crp/shared-middleware";

export const getFeed = async (filters = {}) => {
    const { data, error } = await feedRepo.getFeedPosts(filters);
    if (error) {
        throw new AppError(500, error.message);
    }
    return data || [];
};

export const createMessage = async (body, currentUser) => {
    const userId = currentUser.sub;
    let userName = body.user_name;
    let userRole = "COORDINATOR";

    if (currentUser.globalRoles?.includes("SUPER_ADMIN")) {
        userRole = "SUPER_ADMIN";
    }

    // Resolve user name if not provided
    if (!userName) {
        const { data: userProfile } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("user_id", userId)
            .single();

        if (userProfile) {
            userName = `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim();
        }
        if (!userName) {
            userName = currentUser.email?.split("@")[0] || "Coordinator";
        }
    }

    // Resolve organization
    const orgId = body.organization_id || null;
    let orgName = body.organization_name || null;

    if (orgId && !orgName) {
        const { data: orgData } = await supabase
            .from("organizations")
            .select("organization_name")
            .eq("organization_id", orgId)
            .single();

        if (orgData) {
            orgName = orgData.organization_name;
        }
    }

    const payload = {
        parent_id: body.parent_id || null,
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        organization_id: orgId,
        organization_name: orgName,
        message_type: body.message_type || "GENERAL",
        content: body.content,
        status: body.status || "OPEN",
        proposed_category: body.proposed_category || null,
        proposed_unit: body.proposed_unit || null,
        reactions: {}
    };

    const { data, error } = await feedRepo.createMessage(payload);
    if (error) {
        throw new AppError(500, error.message);
    }
    return data;
};

export const toggleReaction = async (messageId, emoji, userId) => {
    if (!emoji) {
        throw new AppError(400, "Emoji is required");
    }
    const { data, error } = await feedRepo.toggleReaction(messageId, emoji, userId);
    if (error) {
        throw new AppError(500, error.message);
    }
    return data;
};

export const updateStatus = async (messageId, status) => {
    const validStatuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "CLOSED"];
    if (!validStatuses.includes(status)) {
        throw new AppError(400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const { data, error } = await feedRepo.updateMessageStatus(messageId, status);
    if (error) {
        throw new AppError(500, error.message);
    }
    return data;
};

export const deleteMessage = async (messageId, currentUser) => {
    const isSuperAdmin = currentUser.globalRoles?.includes("SUPER_ADMIN");
    const { data, error } = await feedRepo.deleteMessage(messageId, currentUser.sub, isSuperAdmin);
    if (error) {
        throw new AppError(500, error.message);
    }
    return data;
};
