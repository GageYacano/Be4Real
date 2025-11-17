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

const { checkJWT } = await import('../../../../src/utils/jwt.js');
const { default: react } = await import('../../../../src/endpoints/post/react/react.js');

const mockCheckJWT = checkJWT as jest.MockedFunction<typeof checkJWT>;

describe('POST /post/react', () => {
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
    mockRequest.body = {
      postId: new ObjectId().toHexString(),
      reaction: '❤️',
      removeReaction: false,
    };

    mockCheckJWT.mockResolvedValue({
      err: new Error('Invalid token'),
      uid: '',
    } as any);

    await react(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid token',
    });
  });

  it('should add a reaction to a post successfully', async () => {
    const userId = new ObjectId();
    const postId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = {
      postId: postId.toHexString(),
      reaction: '❤️',
      removeReaction: false,
    };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    const mockPostUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });
    const mockUserUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });

    mockDb.collection.mockImplementation((name: string) => {
      if (name === 'posts') {
        return {
          updateOne: mockPostUpdateOne,
        };
      } else if (name === 'users') {
        return {
          updateOne: mockUserUpdateOne,
        };
      }
      return {};
    });

    await react(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Reaction updated',
    });

    // Verify post was updated with $addToSet
    expect(mockPostUpdateOne).toHaveBeenCalledWith(
      { _id: postId },
      { $addToSet: { 'reactions.❤️': userId } }
    );

    // Verify user's reaction count was incremented
    expect(mockUserUpdateOne).toHaveBeenCalledWith(
      { _id: userId },
      { $inc: { reactions: 1 } }
    );
  });

  it('should remove a reaction from a post successfully', async () => {
    const userId = new ObjectId();
    const postId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = {
      postId: postId.toHexString(),
      reaction: '❤️',
      removeReaction: true,
    };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    const mockPostUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });
    const mockUserUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });

    mockDb.collection.mockImplementation((name: string) => {
      if (name === 'posts') {
        return {
          updateOne: mockPostUpdateOne,
        };
      } else if (name === 'users') {
        return {
          updateOne: mockUserUpdateOne,
        };
      }
      return {};
    });

    await react(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Reaction updated',
    });

    // Verify post reaction was removed with $pull
    expect(mockPostUpdateOne).toHaveBeenCalledWith(
      { _id: postId },
      { $pull: { 'reactions.❤️': userId } }
    );

    // Verify user's reaction count was decremented
    expect(mockUserUpdateOne).toHaveBeenCalledWith(
      { _id: userId },
      { $inc: { reactions: -1 } }
    );
  });

  it('should handle different emoji reactions', async () => {
    const userId = new ObjectId();
    const postId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = {
      postId: postId.toHexString(),
      reaction: '🔥',
      removeReaction: false,
    };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    const mockPostUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });
    const mockUserUpdateOne = jest.fn<any>().mockResolvedValue({
      modifiedCount: 1,
    });

    mockDb.collection.mockImplementation((name: string) => {
      if (name === 'posts') {
        return {
          updateOne: mockPostUpdateOne,
        };
      } else if (name === 'users') {
        return {
          updateOne: mockUserUpdateOne,
        };
      }
      return {};
    });

    await react(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockPostUpdateOne).toHaveBeenCalledWith(
      { _id: postId },
      { $addToSet: { 'reactions.🔥': userId } }
    );
  });

  it('should return 500 on database error', async () => {
    const userId = new ObjectId();
    mockRequest.headers = { authorization: 'Bearer valid-token' };
    mockRequest.body = {
      postId: new ObjectId().toHexString(),
      reaction: '❤️',
      removeReaction: false,
    };

    mockCheckJWT.mockResolvedValue({
      err: null,
      uid: userId.toHexString(),
    } as any);

    mockDb.collection.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    await react(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });
});
