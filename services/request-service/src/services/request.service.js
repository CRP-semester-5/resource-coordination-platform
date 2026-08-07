import * as requestRepository from "../repositories/request.repository.js";

export const createRequest = async (requestData) => {

    const existing = await requestRepository.findDuplicate(
        requestData.organization_id,
        requestData.requester_id,
        requestData.title
    );

    if (existing.data) {
        throw new Error("A similar request already exists.");
    }

    const { data, error } =
        await requestRepository.create(requestData);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getRequests = async () => {

    const { data, error } =
        await requestRepository.findAll();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getRequestById = async (requestId) => {

    const { data, error } =
        await requestRepository.findById(requestId);

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error("Request not found.");
    }

    return data;
};

export const updateRequest = async (
    requestId,
    requestData
) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (existing.data.status !== "PENDING") {
        throw new Error(
            "Only pending requests can be updated."
        );
    }

    const { data, error } =
        await requestRepository.update(
            requestId,
            requestData
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const deleteRequest = async (requestId) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    const { data, error } =
        await requestRepository.deleteRequest(requestId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const cancelRequest = async (requestId) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (
        existing.data.status === "FULFILLED" ||
        existing.data.status === "CANCELLED"
    ) {
        throw new Error(
            "This request cannot be cancelled."
        );
    }

    const { data, error } =
        await requestRepository.cancel(requestId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const approveRequest = async (
    requestId,
    verifiedBy
) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (existing.data.status !== "PENDING") {
        throw new Error(
            "Only pending requests can be approved."
        );
    }

    const { data, error } =
        await requestRepository.verify(
            requestId,
            verifiedBy
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const rejectRequest = async (
    requestId,
    verifiedBy,
    reason
) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (existing.data.status !== "PENDING") {
        throw new Error(
            "Only pending requests can be rejected."
        );
    }

    const { data, error } =
        await requestRepository.reject(
            requestId,
            verifiedBy,
            reason
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const fulfillRequest = async (requestId) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (
        existing.data.status !== "IN_PROGRESS" &&
        existing.data.status !== "ASSIGNED"
    ) {
        throw new Error(
            "Only assigned or in-progress requests can be fulfilled."
        );
    }

    const { data, error } =
        await requestRepository.fulfill(requestId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};