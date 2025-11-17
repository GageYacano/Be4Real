import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import login from '../../../src/endpoints/auth/login.js';
import { setTestDB } from '../../../src/utils/mongo.js';
import bcrypt from 'bcrypt';
import { createJWT } from '../../../src/utils/jwt.js';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));
jest.mock('../../../src/utils/jwt.js', () => ({
  createJWT: jest.fn(),
}));

describe('POST /auth/login', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockDb: any;

  beforeEach(() => {
    process.env.ENV = 'TESTING';

    mockJson = jest.fn();
    mockStatus = jest.fn();

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockStatus.mockReturnValue(mockResponse);

    mockDb = {
      collection: jest.fn(),
    };

    setTestDB(mockDb as any);
    jest.clearAllMocks();
  });

  afterEach(() => {
    setTestDB(null);
    delete process.env.ENV;
  });

  it('should return 400 if missing fields', async () => {
    mockRequest.body = { email: '', password: '' };

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Missing fields',
    });
  });

  it('should return 400 if user not found', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'password123' };

    mockDb.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid username or password',
    });
  });

  it('should return 400 if password incorrect', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'password123' };

    mockDb.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        _id: new ObjectId(),
        email: 'test@example.com',
        passHash: 'fakehash',
        verified: true,
        loginMethod: 'password',
      }),
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid username or password',
    });
  });

  it('should return 200 and token if login successful', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'password123' };
    const fakeUserId = new ObjectId();

    mockDb.collection.mockReturnValue({
      findOne: jest.fn().mockResolvedValue({
        _id: fakeUserId,
        email: 'test@example.com',
        passHash: 'fakehash',
        verified: true,
        loginMethod: 'password',
      }),
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (createJWT as jest.Mock).mockResolvedValue('faketoken');

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Log in successful',
      token: 'faketoken',
    });
  });

  it('should return 500 on database error', async () => {
    mockRequest.body = { email: 'test@example.com', password: 'password123' };
    mockDb.collection.mockImplementation(() => {
      throw new Error('DB error');
    });

    await login(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });
});
