import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { setTestDB } from '../../../src/utils/mongo.js';

// Mock JWT utilities
jest.unstable_mockModule('../../../src/utils/jwt.js', () => ({
  checkJWT: jest.fn(),
  getJWT: jest.fn(),
  createJWT: jest.fn(),
  checkAndRefreshJWT: jest.fn(),
}));

const { checkJWT } = await import('../../../src/utils/jwt.js');
const { default: makePost } = await import('../../../src/endpoints/post/make_post.js');

const mockCheckJWT = checkJWT as jest.MockedFunction<typeof checkJWT>;

describe('POST /post/make-post', () => {
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

  it('should return 401 if JWT check fails', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' };
    mockRequest.body = { imgData: 'data:image/png;base64,abc123' };

    mockCheckJWT.mockResolvedValue({
      err: new Error('Invalid token'),
      uid: '',
    } as any);

    await makePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid token',
    });
  });

  it('should return 400 if imgData is missing', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = {};

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: new ObjectId().toHexString(),
    } as any);

    await makePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Missing fields',
    });
  });

  it('should return 400 if imgData is empty string', async () => {
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = { imgData: '' };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: new ObjectId().toHexString(),
    } as any);

    await makePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Missing fields', // Empty string is falsy, so caught by !imgData check
    });
  });

  it('should return 404 if user not found', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = { imgData: 'data:image/png;base64,abc123' };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    const mockFindOne = jest.fn<any>().mockResolvedValue(null);
    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await makePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'User not found',
    });
  });

  it('should create post and return 200 on success', async () => {
    const userId = new ObjectId();
    const postId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = { imgData: 'data:image/png;base64,abc123' };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    const mockUser = {
      _id: userId,
      username: 'testuser',
      posts: [],
    };

    const mockFindOne = jest.fn<any>().mockResolvedValue(mockUser);
    const mockInsertOne = jest.fn<any>().mockResolvedValue({
      insertedId: postId,
    });
    const mockUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });

    let collectionName = '';
    mockDb.collection.mockImplementation((name: string) => {
      collectionName = name;
      if (name === 'posts') {
        return {
          insertOne: mockInsertOne,
        };
      } else if (name === 'users') {
        return {
          findOne: mockFindOne,
          updateOne: mockUpdateOne,
        };
      }
      return {};
    });

    await makePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Post created',
      data: {
        postId: postId.toString(),
      },
    });

    // Verify post was inserted
    expect(mockInsertOne).toHaveBeenCalled();
    const insertedPost = mockInsertOne.mock.calls[0][0];
    expect(insertedPost.imgData).toBe('data:image/png;base64,abc123');
    expect(insertedPost.user).toEqual(userId);
    expect(insertedPost.reactions).toBeDefined();

    // Verify user's posts array was updated
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: userId },
      { $push: { posts: postId } }
    );
  });

  it('should return 500 on database error', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = { imgData: 'data:image/png;base64,abc123' };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    mockDb.collection.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    await makePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });
});
