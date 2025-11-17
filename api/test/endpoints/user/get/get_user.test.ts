import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import getUser from '../../../../src/endpoints/user/get/get_user.js';
import { setTestDB } from '../../../../src/utils/mongo.js';

describe('GET /user/get/:identifier', () => {
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
      params: {},
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockStatus.mockReturnValue(mockResponse);

    // Create mock database
    mockDb = {
      collection: jest.fn(),
    };

    // Inject the mock database
    setTestDB(mockDb as any);

    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    setTestDB(null);
    delete process.env.ENV;
  });

  it('should return 400 if identifier is missing', async () => {
    mockRequest.params = {};

    await getUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Missing user identifier (Hint: must be passed as route parameter)',
    });
  });

  it('should return 404 if user not found by any method', async () => {
    mockRequest.params = { identifier: 'nonexistent' };

    const mockFindOne = jest.fn<any>().mockResolvedValue(null);

    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'User not found',
    });
  });

  it('should find user by valid user ID', async () => {
    const userId = new ObjectId();
    mockRequest.params = { identifier: userId.toHexString() };

    const mockUser = {
      _id: userId,
      ctime: Date.now(),
      username: 'testuser',
      posts: [],
      profileImg: 'profile.jpg',
      followers: [],
      following: [],
      reactions: 0,
    };

    const mockFindOne = jest.fn<any>()
      .mockResolvedValueOnce(mockUser); // First call finds user by ID

    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'User retrieved',
      data: {
        user: {
          id: mockUser._id,
          ctime: mockUser.ctime,
          username: mockUser.username,
          posts: mockUser.posts,
          profileImg: mockUser.profileImg,
          followers: mockUser.followers,
          following: mockUser.following,
          reactions: mockUser.reactions,
        },
      },
    });
  });

  it('should find user by username', async () => {
    mockRequest.params = { identifier: 'testuser' };

    const mockUser = {
      _id: new ObjectId(),
      ctime: Date.now(),
      username: 'testuser',
      posts: [],
      profileImg: 'profile.jpg',
      followers: [],
      following: [],
      reactions: 5,
    };

    // For username lookup, the findUserByUsername function queries: {username: identifier}
    // Since 'testuser' is not a valid ObjectId, both ID lookups return null without querying DB
    // So only one call to findOne happens: the username lookup
    const mockFindOne = jest.fn<any>()
      .mockResolvedValue(mockUser); // Username search finds user

    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'User retrieved',
      data: {
        user: {
          id: mockUser._id,
          ctime: mockUser.ctime,
          username: mockUser.username,
          posts: mockUser.posts,
          profileImg: mockUser.profileImg,
          followers: mockUser.followers,
          following: mockUser.following,
          reactions: mockUser.reactions,
        },
      },
    });
  });

  it('should find user by post ID', async () => {
    const userId = new ObjectId();
    const postId = new ObjectId();
    mockRequest.params = { identifier: postId.toHexString() };

    const mockPost = {
      _id: postId,
      user: userId,
      imgData: 'data',
    };

    const mockUser = {
      _id: userId,
      ctime: Date.now(),
      username: 'testuser',
      posts: [postId],
      profileImg: 'profile.jpg',
      followers: [],
      following: [],
      reactions: 0,
    };

    let callCount = 0;
    const mockFindOne = jest.fn<any>().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve(null); // Not found by user ID
      if (callCount === 2) return Promise.resolve(mockPost); // Found post
      if (callCount === 3) return Promise.resolve(mockUser); // Found user by post's user field
      return Promise.resolve(null);
    });

    let collectionCallCount = 0;
    mockDb.collection.mockImplementation((name: string) => {
      collectionCallCount++;
      return { findOne: mockFindOne };
    });

    await getUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'User retrieved',
      data: {
        user: {
          id: mockUser._id,
          ctime: mockUser.ctime,
          username: mockUser.username,
          posts: mockUser.posts,
          profileImg: mockUser.profileImg,
          followers: mockUser.followers,
          following: mockUser.following,
          reactions: mockUser.reactions,
        },
      },
    });
  });

  it('should return 500 on database error', async () => {
    mockRequest.params = { identifier: 'test' };

    mockDb.collection.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    await getUser(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });
});
