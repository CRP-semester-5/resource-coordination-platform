import { supabase } from "../lib/supabase.js";
import { AppError } from "@crp/shared-middleware";

export const createCategory = async (req, res, next) => {
    try {
        const { name, description, unit_of_measure } = req.body;
        const { data, error } = await supabase
            .from("resource_categories")
            .insert([{ name, description, unit_of_measure }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // unique violation
                throw new AppError(409, "Category with this name already exists");
            }
            throw new AppError(500, error.message);
        }

        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};

export const getCategories = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from("resource_categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw new AppError(500, error.message);
        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from("resource_categories")
            .select("*")
            .eq("category_id", id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') throw new AppError(404, "Category not found");
            throw new AppError(500, error.message);
        }
        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from("resource_categories")
            .update(req.body)
            .eq("category_id", id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') throw new AppError(409, "Category with this name already exists");
            throw new AppError(500, error.message);
        }
        if (!data) throw new AppError(404, "Category not found");

        res.json(data);
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from("resource_categories")
            .delete()
            .eq("category_id", id)
            .select()
            .single();

        if (error) throw new AppError(500, error.message);
        if (!data) throw new AppError(404, "Category not found");

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
