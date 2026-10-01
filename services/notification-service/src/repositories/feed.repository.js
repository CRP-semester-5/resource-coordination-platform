import { supabase } from "../lib/supabase.js";

/**
 * Coordination Feed Repository
 * Handles single-table operations with threaded replies and JSONB reactions.
 */

export const getFeedPosts = async ({ type, status, limit = 50, offset = 0 } = {}) => {
    let query = supabase
        .from("coordination_feed")
        .select("*")
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (type && type !== "ALL") {
        query = query.eq("message_type", type);
    }
    if (status && status !== "ALL") {
        query = query.eq("status", status);
    }

    const { data: posts, error } = await query;
    if (error) return { data: null, error };
    if (!posts || posts.length === 0) return { data: [] };

    // Fetch replies for these parent posts
    const postIds = posts.map(p => p.message_id);
    const { data: replies, error: replyError } = await supabase
        .from("coordination_feed")
        .select("*")
        .in("parent_id", postIds)
        .order("created_at", { ascending: true });

    if (replyError) {
        console.error("[FeedRepository] Error fetching replies:", replyError);
    }

    const repliesByParent = {};
    (replies || []).forEach(r => {
        if (!repliesByParent[r.parent_id]) repliesByParent[r.parent_id] = [];
        repliesByParent[r.parent_id].push(r);
    });

    const enrichedPosts = posts.map(p => ({
        ...p,
        replies: repliesByParent[p.message_id] || []
    }));

    return { data: enrichedPosts };
};

export const getMessageById = async (messageId) => {
    return await supabase
        .from("coordination_feed")
        .select("*")
        .eq("message_id", messageId)
        .single();
};

export const createMessage = async (data) => {
    return await supabase
        .from("coordination_feed")
        .insert({
            parent_id: data.parent_id || null,
            user_id: data.user_id,
            user_name: data.user_name,
            user_role: data.user_role || "COORDINATOR",
            organization_id: data.organization_id || null,
            organization_name: data.organization_name || null,
            message_type: data.message_type || "GENERAL",
            content: data.content,
            status: data.status || "OPEN",
            proposed_category: data.proposed_category || null,
            proposed_unit: data.proposed_unit || null,
            reactions: data.reactions || {}
        })
        .select()
        .single();
};

export const toggleReaction = async (messageId, emoji, userId) => {
    const { data: post, error: fetchErr } = await supabase
        .from("coordination_feed")
        .select("reactions")
        .eq("message_id", messageId)
        .single();

    if (fetchErr || !post) {
        return { data: null, error: fetchErr || new Error("Message not found") };
    }

    const reactions = { ...(post.reactions || {}) };
    const userList = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
    const index = userList.indexOf(userId);

    if (index > -1) {
        userList.splice(index, 1);
    } else {
        userList.push(userId);
    }

    if (userList.length === 0) {
        delete reactions[emoji];
    } else {
        reactions[emoji] = userList;
    }

    return await supabase
        .from("coordination_feed")
        .update({ reactions, updated_at: new Date().toISOString() })
        .eq("message_id", messageId)
        .select()
        .single();
};

export const updateMessageStatus = async (messageId, status) => {
    return await supabase
        .from("coordination_feed")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("message_id", messageId)
        .select()
        .single();
};

export const deleteMessage = async (messageId, userId, isSuperAdmin) => {
    let query = supabase.from("coordination_feed").delete().eq("message_id", messageId);
    if (!isSuperAdmin) {
        query = query.eq("user_id", userId);
    }
    return await query.select().single();
};
