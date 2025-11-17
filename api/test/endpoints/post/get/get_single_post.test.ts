import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import getSinglePost from '../../../../src/endpoints/post/get/get_single_post.js';
import { setTestDB } from '../../../../src/utils/mongo.js';

describe('GET /post/get/:postId', () => {
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

  it('should return 400 if postId is missing', async () => {

    mockRequest.params = {};

    await getSinglePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Missing post ID (Hint: must be passed as route parameter)',
    });
  });

  // postId is valid test
  it('should return 400 if postId is invalid', async () => {
    mockRequest.params = { postId: 'invalid-id' };

    await getSinglePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid post ID',
    });
  });

  // post does not exist test
  it('should return 404 if post does not exist', async () => {
    const validObjectId = new ObjectId().toHexString();
    mockRequest.params = { postId: validObjectId };

    const mockFindOne = jest.fn<any>().mockResolvedValue(null);
    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getSinglePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Post not found',
    });
  });

  // successful get test
  it('should return 200 and post data on successful retrieval', async () => {
    const validObjectId = new ObjectId();
    mockRequest.params = { postId: validObjectId.toHexString() };

    const mockPost = {
      _id: validObjectId,
      userId: new ObjectId(),
      content: 'Test post content',
      imageUrl: 'https://example.com/image.jpg',
      createdAt: new Date(),
      reactions: [],
    };

    const mockFindOne = jest.fn<any>().mockResolvedValue(mockPost);
    mockDb.collection.mockReturnValue({
      findOne: mockFindOne,
    });

    await getSinglePost(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Post retrieved',
      data: {
        post: mockPost,
      },
    });
  });
});
