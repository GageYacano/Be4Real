import { Request, Response } from "express";
import resetPassword from "../../../src/endpoints/auth/reset_password.js"; // Adjust path as needed

// Mock the dependencies
jest.mock("../../utils/mongo.js");
jest.mock("bcrypt");

describe("Reset Password Function", () => {
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
        mockReq.body = { 
            newPassword: "newpassword123",
            code: "123456"
        };
        
        await resetPassword(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });

    test("should return 400 when newPassword is missing", async () => {
        mockReq.body = { 
            email: "test@example.com",
            code: "123456"
        };
        
        await resetPassword(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });

    test("should return 400 when code is missing", async () => {
        mockReq.body = { 
            email: "test@example.com",
            newPassword: "newpassword123"
        };
        
        await resetPassword(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });

    test("should return 400 when all fields are missing", async () => {
        mockReq.body = {};
        
        await resetPassword(mockReq as Request, mockRes as Response);
        
        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
            status: "error",
            message: "Missing fields"
        });
    });
});