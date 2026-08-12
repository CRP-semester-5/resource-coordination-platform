import * as resourceRepository 
from "../repositories/resource.repository.js";

export const createResource = async(resourceData)=>{

    const {data,error} =
        await resourceRepository.create(resourceData);

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const getResources = async()=>{

    const {data,error} =
        await resourceRepository.findAll();

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const getResourceById = async(resourceId)=>{

    const {data,error} =
        await resourceRepository.findById(resourceId);

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const updateResource = async(
    resourceId,
    resourceData
)=>{

    const {data,error} =
        await resourceRepository.update(
            resourceId,
            resourceData
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};

export const deleteResource = async(resourceId)=>{

    const {error} =
        await resourceRepository.remove(resourceId);

    if(error){
        throw new Error(error.message);
    }

    return true;

};
