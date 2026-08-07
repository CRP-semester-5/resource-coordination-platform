import * as resourceService 
from "../services/resource.service.js";

export const createResource = async(req,res)=>{

    try{

        const resource =
            await resourceService.createResource(
                req.body
            );

        return res.status(201).json({

            success:true,

            message:"Resource created successfully.",

            data:resource

        });

    }catch(error){

        return res.status(400).json({

            success:false,

            message:error.message

        });

    }

};

export const getResources = async(req,res)=>{

    try{

        const resources =
            await resourceService.getResources();

        return res.json({
            success:true,
            data:resources
        });

    }catch(error){

        return res.status(400).json({

            success:false,

            message:error.message

        });

    }

};

export const getResourceById = async(req,res)=>{

    try{

        const resource =
            await resourceService.getResourceById(
                req.params.id
            );

        return res.json({
            success:true,
            data:resource
        });

    }catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }

};

export const updateResource = async(req,res)=>{

    try{

        const resource =
            await resourceService.updateResource(
                req.params.id,
                req.body
            );

        return res.json({
            success:true,
            message:"Resource updated successfully.",
            data:resource
        });

    }catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const deleteResource = async(req,res)=>{

    try{

        await resourceService.deleteResource(
            req.params.id
        );

        return res.json({
            success:true,
            message:"Resource deleted successfully."
        });

    }catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }

};
