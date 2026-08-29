/**
 * Unit Tests: request.service.js
 *
 * Strategy: mock the entire request.repository module so no Supabase
 * connection is required. Each test validates the service-layer business
 * logic in isolation.
 */
import { jest } from "@jest/globals";

// -- Mock the repository before importing the service --
jest.unstable_mockModule(
  "../repositories/request.repository.js",
  () => ({
    findDuplicate:  jest.fn(),
    create:         jest.fn(),
    findAll:        jest.fn(),
    findById:       jest.fn(),
    update:         jest.fn(),
    cancel:         jest.fn(),
    verify:         jest.fn(),
    reject:         jest.fn(),
    fulfill:        jest.fn(),
    deleteRequest:  jest.fn(),
  })
);

const requestRepo    = await import("../repositories/request.repository.js");
const requestService = await import("../services/request.service.js");

// -- Shared fixtures --
const MOCK_REQUEST_ID = "req-uuid-1234";
const ORG_ID          = "org-uuid-5678";
const USER_ID         = "user-uuid-9012";
const COORDINATOR_ID  = "coord-uuid-3456";

const makeRequest = (overrides = {}) => ({
  request_id:      MOCK_REQUEST_ID,
  organization_id: ORG_ID,
  requester_id:    USER_ID,
  title:           "Need food supplies",
  description:     "30 families need rice and lentils for two weeks",
  category:        "Food & Nutrition",
  quantity_required: 50,
  unit:            "kg",
  urgency:         "HIGH",
  status:          "PENDING",
  location:        "Colombo",
  created_at:      new Date().toISOString(),
  ...overrides,
});

// -- createRequest --
describe("createRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a request when no duplicate exists", async () => {
    const mockReq = makeRequest();
    requestRepo.findDuplicate.mockResolvedValue({ data: null, error: null });
    requestRepo.create.mockResolvedValue({ data: mockReq, error: null });

    const result = await requestService.createRequest({
      organization_id:   ORG_ID,
      requester_id:      USER_ID,
      title:             "Need food supplies",
      description:       "30 families need rice and lentils for two weeks",
      quantity_required: 50,
      unit:              "kg",
    });

    expect(requestRepo.findDuplicate).toHaveBeenCalledTimes(1);
    expect(requestRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockReq);
  });

  it("throws when a duplicate request exists", async () => {
    requestRepo.findDuplicate.mockResolvedValue({
      data: makeRequest(),
      error: null,
    });

    await expect(
      requestService.createRequest({
        organization_id: ORG_ID,
        requester_id:    USER_ID,
        title:           "Need food supplies",
      })
    ).rejects.toThrow("A similar request already exists.");

    expect(requestRepo.create).not.toHaveBeenCalled();
  });

  it("throws when the repository create returns an error", async () => {
    requestRepo.findDuplicate.mockResolvedValue({ data: null, error: null });
    requestRepo.create.mockResolvedValue({
      data: null,
      error: { message: "DB insert failed" },
    });

    await expect(
      requestService.createRequest({
        organization_id: ORG_ID,
        requester_id:    USER_ID,
        title:           "New request",
      })
    ).rejects.toThrow("DB insert failed");
  });
});

// -- getRequests --
describe("getRequests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns an array of requests", async () => {
    const list = [makeRequest(), makeRequest({ request_id: "req-2", title: "Need blankets" })];
    requestRepo.findAll.mockResolvedValue({ data: list, error: null });

    const result = await requestService.getRequests();
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Need food supplies");
  });

  it("throws on repository error", async () => {
    requestRepo.findAll.mockResolvedValue({
      data: null,
      error: { message: "Connection timeout" },
    });

    await expect(requestService.getRequests()).rejects.toThrow("Connection timeout");
  });
});

// -- getRequestById --
describe("getRequestById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns the request when found", async () => {
    const mockReq = makeRequest();
    requestRepo.findById.mockResolvedValue({ data: mockReq, error: null });

    const result = await requestService.getRequestById(MOCK_REQUEST_ID);
    expect(result).toEqual(mockReq);
    expect(requestRepo.findById).toHaveBeenCalledWith(MOCK_REQUEST_ID);
  });

  it("throws 'Request not found' when data is null", async () => {
    requestRepo.findById.mockResolvedValue({ data: null, error: null });

    await expect(
      requestService.getRequestById("nonexistent-id")
    ).rejects.toThrow("Request not found.");
  });

  it("throws the repository error message when an error occurs", async () => {
    requestRepo.findById.mockResolvedValue({
      data: null,
      error: { message: "Query failed" },
    });

    await expect(
      requestService.getRequestById(MOCK_REQUEST_ID)
    ).rejects.toThrow("Query failed");
  });
});

// -- updateRequest --
describe("updateRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates a PENDING request", async () => {
    const existing = makeRequest({ status: "PENDING" });
    const updated  = makeRequest({ status: "PENDING", urgency: "CRITICAL" });
    requestRepo.findById.mockResolvedValue({ data: existing, error: null });
    requestRepo.update.mockResolvedValue({ data: updated, error: null });

    const result = await requestService.updateRequest(MOCK_REQUEST_ID, { urgency: "CRITICAL" });
    expect(result.urgency).toBe("CRITICAL");
  });

  it("throws when the request does not exist", async () => {
    requestRepo.findById.mockResolvedValue({ data: null, error: null });

    await expect(
      requestService.updateRequest("bad-id", { urgency: "LOW" })
    ).rejects.toThrow("Request not found.");
  });

  it("throws when status is not PENDING", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "VERIFIED" }),
      error: null,
    });

    await expect(
      requestService.updateRequest(MOCK_REQUEST_ID, { urgency: "LOW" })
    ).rejects.toThrow("Only pending requests can be updated.");

    expect(requestRepo.update).not.toHaveBeenCalled();
  });
});

// -- cancelRequest --
describe("cancelRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("cancels a PENDING request", async () => {
    requestRepo.findById.mockResolvedValue({ data: makeRequest(), error: null });
    requestRepo.cancel.mockResolvedValue({
      data: makeRequest({ status: "CANCELLED" }),
      error: null,
    });

    const result = await requestService.cancelRequest(MOCK_REQUEST_ID);
    expect(result.status).toBe("CANCELLED");
  });

  it("throws when request is already FULFILLED", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "FULFILLED" }),
      error: null,
    });

    await expect(
      requestService.cancelRequest(MOCK_REQUEST_ID)
    ).rejects.toThrow("This request cannot be cancelled.");
  });

  it("throws when request is already CANCELLED", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "CANCELLED" }),
      error: null,
    });

    await expect(
      requestService.cancelRequest(MOCK_REQUEST_ID)
    ).rejects.toThrow("This request cannot be cancelled.");
  });

  it("throws when request is not found", async () => {
    requestRepo.findById.mockResolvedValue({ data: null, error: null });

    await expect(
      requestService.cancelRequest("bad-id")
    ).rejects.toThrow("Request not found.");
  });
});

// -- approveRequest --
describe("approveRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("approves a PENDING request", async () => {
    requestRepo.findById.mockResolvedValue({ data: makeRequest(), error: null });
    requestRepo.verify.mockResolvedValue({
      data: makeRequest({ status: "VERIFIED" }),
      error: null,
    });

    const result = await requestService.approveRequest(
      MOCK_REQUEST_ID,
      COORDINATOR_ID,
      ORG_ID
    );
    expect(result.status).toBe("VERIFIED");
    expect(requestRepo.verify).toHaveBeenCalledWith(MOCK_REQUEST_ID, COORDINATOR_ID, ORG_ID);
  });

  it("throws when request is not PENDING", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "REJECTED" }),
      error: null,
    });

    await expect(
      requestService.approveRequest(MOCK_REQUEST_ID, COORDINATOR_ID, ORG_ID)
    ).rejects.toThrow("Only pending requests can be approved.");
  });

  it("throws when orgId mismatches the request organization_id", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ organization_id: "other-org-id" }),
      error: null,
    });

    await expect(
      requestService.approveRequest(MOCK_REQUEST_ID, COORDINATOR_ID, ORG_ID)
    ).rejects.toThrow("Unauthorized: Request is already assigned to another organization.");
  });

  it("throws when request is not found", async () => {
    requestRepo.findById.mockResolvedValue({ data: null, error: null });

    await expect(
      requestService.approveRequest("bad-id", COORDINATOR_ID, ORG_ID)
    ).rejects.toThrow("Request not found.");
  });
});

// -- rejectRequest --
describe("rejectRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a PENDING request with a reason", async () => {
    requestRepo.findById.mockResolvedValue({ data: makeRequest(), error: null });
    requestRepo.reject.mockResolvedValue({
      data: makeRequest({ status: "REJECTED", rejection_reason: "Insufficient details" }),
      error: null,
    });

    const result = await requestService.rejectRequest(
      MOCK_REQUEST_ID,
      COORDINATOR_ID,
      "Insufficient details",
      ORG_ID
    );
    expect(result.status).toBe("REJECTED");
    expect(result.rejection_reason).toBe("Insufficient details");
  });

  it("throws when request is not PENDING", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "VERIFIED" }),
      error: null,
    });

    await expect(
      requestService.rejectRequest(MOCK_REQUEST_ID, COORDINATOR_ID, "reason", ORG_ID)
    ).rejects.toThrow("Only pending requests can be rejected.");
  });
});

// -- fulfillRequest --
describe("fulfillRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fulfills an ASSIGNED request", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "ASSIGNED" }),
      error: null,
    });
    requestRepo.fulfill.mockResolvedValue({
      data: makeRequest({ status: "FULFILLED" }),
      error: null,
    });

    const result = await requestService.fulfillRequest(MOCK_REQUEST_ID);
    expect(result.status).toBe("FULFILLED");
  });

  it("fulfills an IN_PROGRESS request", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "IN_PROGRESS" }),
      error: null,
    });
    requestRepo.fulfill.mockResolvedValue({
      data: makeRequest({ status: "FULFILLED" }),
      error: null,
    });

    const result = await requestService.fulfillRequest(MOCK_REQUEST_ID);
    expect(result.status).toBe("FULFILLED");
  });

  it("throws when status is PENDING (not fulfillable)", async () => {
    requestRepo.findById.mockResolvedValue({
      data: makeRequest({ status: "PENDING" }),
      error: null,
    });

    await expect(
      requestService.fulfillRequest(MOCK_REQUEST_ID)
    ).rejects.toThrow("Only assigned or in-progress requests can be fulfilled.");
    expect(requestRepo.fulfill).not.toHaveBeenCalled();
  });

  it("throws when request is not found", async () => {
    requestRepo.findById.mockResolvedValue({ data: null, error: null });

    await expect(
      requestService.fulfillRequest("bad-id")
    ).rejects.toThrow("Request not found.");
  });
});

// -- deleteRequest --
describe("deleteRequest", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes a request that exists", async () => {
    requestRepo.findById.mockResolvedValue({ data: makeRequest(), error: null });
    requestRepo.deleteRequest.mockResolvedValue({ data: {}, error: null });

    const result = await requestService.deleteRequest(MOCK_REQUEST_ID);
    expect(requestRepo.deleteRequest).toHaveBeenCalledWith(MOCK_REQUEST_ID);
    expect(result).toBeDefined();
  });

  it("throws when request does not exist", async () => {
    requestRepo.findById.mockResolvedValue({ data: null, error: null });

    await expect(
      requestService.deleteRequest("nonexistent-id")
    ).rejects.toThrow("Request not found.");
  });
});
