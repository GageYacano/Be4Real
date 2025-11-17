import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { setTestDB } from '../../../../src/utils/mongo.js';

// Mock JWT utilities
jest.unstable_mockModule('../../../../src/utils/jwt.js', () => ({
  checkJWT: jest.fn(),
  getJWT: jest.fn(),
  createJWT: jest.fn(),
  checkAndRefreshJWT: jest.fn(),
}));

const { checkAndRefreshJWT } = await import('../../../../src/utils/jwt.js');
const { default: getCurrentUser } = await import('../../../../src/endpoints/user/get/me.js');

const mockCheckAndRefreshJWT = checkAndRefreshJWT as jest.MockedFunction<typeof checkAndRefreshJWT>;

describe('GET /user/me', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: any;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockDb: any;

  beforeEach(() => {
    // Set ENV=TESTING
    process.env.ENV = 'TESTING';

    mockJson = jest.fn();
    mockStatus = jest.fn();

    mockRequest = {
      headers: {},
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

  it('should return 401 if JWT check fails', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' };

    mockCheckAndRefreshJWT.mockResolvedValue({
      err: new Error('Invalid token'),
      uid: '',
      token: '',
    } as any);

    await getCurrentUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid token',
    });
  });

  it('should return 400 if user ID in token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' };

    mockCheckAndRefreshJWT.mockResolvedValue({
      err: null,
      uid: 'invalid-object-id',
      token: 'Bearer valid-token',
    } as any);

    await getCurrentUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid user id in token',
    });
  });

  it('should return 404 if user not found', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };

    mockCheckAndRefreshJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
      token: 'Bearer valid-token',
    } as any);

    const mockFindOne = jest.fn<any>().mockResolvedValue(null);
    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getCurrentUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'User not found',
    });
    expect(mockFindOne).toHaveBeenCalledWith({ _id: userId });
  });

  it('should return user data with original token on success', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };

    const mockUser = {
      _id: userId,
      username: 'testuser',
      followers: ['follower1', 'follower2'],
      following: ['following1'],
      reactions: 42,
    };

    mockCheckAndRefreshJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
      token: 'Bearer valid-token',
    } as any);

    const mockFindOne = jest.fn<any>().mockResolvedValue(mockUser);
    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getCurrentUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      token: 'Bearer valid-token',
      user: {
        id: userId.toHexString(),
        username: 'testuser',
        followers: ['follower1', 'follower2'],
        following: ['following1'],
        reactions: 42,
      },
    });
  });

  it('should return user data with refreshed token when token is refreshed', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer expiring-token' };

    const mockUser = {
      _id: userId,
      username: 'testuser',
      followers: [],
      following: [],
      reactions: 0,
    };

    // Simulate token refresh
    mockCheckAndRefreshJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
      token: 'Bearer new-refreshed-token',
    } as any);

    const mockFindOne = jest.fn<any>().mockResolvedValue(mockUser);
    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getCurrentUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      token: 'Bearer new-refreshed-token',
      user: {
        id: userId.toHexString(),
        username: 'testuser',
        followers: [],
        following: [],
        reactions: 0,
      },
    });
  });

  it('should return 500 on database error', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };

    mockCheckAndRefreshJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
      token: 'Bearer valid-token',
    } as any);

    mockDb.collection.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    await getCurrentUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });
});
