import { Request, Response } from "express";
import login from "../../../src/endpoints/auth/login"; // Adjust path as needed

// Mock the dependencies
jest.mock("../../utils/mongo.js");
jest.mock("../../utils/jwt.js");
jest.mock("bcrypt");

describe("Login Function", () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        // Reset mocks before each test
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        
        mockReq = {
            body: {}
        };
        
        mockRes = {
            status: mockStatus,
            json: mockJson
        };
    });

    test("should return 400 when email is missing", async () => {
        mockReq.body = { password: "testpassword123" };
        
        await login(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });

    test("should return 400 when password is missing", async () => {
        mockReq.body = { email: "test@example.com" };
        
        await login(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });

    test("should return 400 when both email and password are missing", async () => {
        mockReq.body = {};
        
        await login(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });
});