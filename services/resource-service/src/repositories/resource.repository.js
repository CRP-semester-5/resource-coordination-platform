import { supabase } from "../lib/supabase.js";

export const create = async (resourceData) => {

    return await supabase
        .from("resources")
        .insert([resourceData])
        .select()
        .single();

};

export const findAll = async () => {

    return await supabase
        .from("resources")
        .select("*");

};

export const findById = async (resourceId) => {

    return await supabase
        .from("resources")
        .select("*")
        .eq("resource_id", resourceId)
        .single();

};

export const update = async (
    resourceId,
    resourceData
) => {

    return await supabase
        .from("resources")
        .update(resourceData)
        .eq("resource_id", resourceId)
        .select()
        .single();

};

export const remove = async (resourceId) => {

    return await supabase
        .from("resources")
        .delete()
        .eq("resource_id", resourceId);

};