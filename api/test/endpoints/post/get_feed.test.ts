import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import getFeed from '../../../src/endpoints/post/get_feed.js';
import { setTestDB } from '../../../src/utils/mongo.js';

describe('GET /post/get-feed', () => {
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
      query: {},
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

  it('should return 400 if limit is invalid', async () => {
    mockRequest.query = { limit: 'invalid' };

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Invalid limit',
    });
  });

  it('should return 400 if both before and after are provided', async () => {
    const postId = new ObjectId().toHexString();
    mockRequest.query = {
      before: postId,
      after: postId
    };

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: "Cannot use both 'before' and 'after' params",
    });
  });

  it('should return 400 if before param has invalid ObjectId', async () => {
    mockRequest.query = { before: 'invalid-id' };

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: "Invalid 'before' post ID",
    });
  });

  it('should return 400 if after param has invalid ObjectId', async () => {
    mockRequest.query = { after: 'invalid-id' };

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: "Invalid 'after' post ID",
    });
  });


  it('should return posts with default limit (no params)', async () => {
    mockRequest.query = {};

    const mockId1 = new ObjectId();
    const mockId2 = new ObjectId();
    const mockPosts = [
      { _id: mockId1, ctime: Date.now(), imgData: 'data1' },
      { _id: mockId2, ctime: Date.now() - 1000, imgData: 'data2' },
    ];

    const mockToArray = jest.fn<any>().mockResolvedValue(mockPosts);
    const mockLimit = jest.fn<any>().mockReturnValue({ toArray: mockToArray });
    const mockSort = jest.fn<any>().mockReturnValue({ limit: mockLimit });
    const mockFind = jest.fn<any>().mockReturnValue({ sort: mockSort });

    mockDb.collection.mockReturnValue({
      find: mockFind,
    });

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Feed retrieved',
      data: {
        count: 2,
        posts: [
          { _id: mockId1.toString(), ctime: mockPosts[0].ctime, imgData: 'data1', postId: mockId1.toString() },
          { _id: mockId2.toString(), ctime: mockPosts[1].ctime, imgData: 'data2', postId: mockId2.toString() },
        ],
      },
    });
    expect(mockFind).toHaveBeenCalledWith({});
    expect(mockSort).toHaveBeenCalledWith({ _id: -1 });
    expect(mockLimit).toHaveBeenCalledWith(20); // default limit
  });

  it('should respect custom limit up to max of 50', async () => {
    mockRequest.query = { limit: '100' };

    const mockPosts: any[] = [];
    const mockToArray = jest.fn<any>().mockResolvedValue(mockPosts);
    const mockLimit = jest.fn<any>().mockReturnValue({ toArray: mockToArray });
    const mockSort = jest.fn<any>().mockReturnValue({ limit: mockLimit });
    const mockFind = jest.fn<any>().mockReturnValue({ sort: mockSort });

    mockDb.collection.mockReturnValue({
      find: mockFind,
    });

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockLimit).toHaveBeenCalledWith(50); // capped at max
  });

  it('should return posts before pivot post', async () => {
    const pivotId = new ObjectId();
    mockRequest.query = { before: pivotId.toHexString() };

    const mockId1 = new ObjectId();
    const mockId2 = new ObjectId();
    const mockOlderPosts = [
      { _id: mockId1, ctime: Date.now() - 1000, imgData: 'data1' },
      { _id: mockId2, ctime: Date.now() - 2000, imgData: 'data2' },
    ];

    const mockToArray = jest.fn<any>().mockResolvedValue(mockOlderPosts);
    const mockLimit = jest.fn<any>().mockReturnValue({ toArray: mockToArray });
    const mockSort = jest.fn<any>().mockReturnValue({ limit: mockLimit });
    const mockFind = jest.fn<any>().mockReturnValue({ sort: mockSort });

    mockDb.collection.mockReturnValue({
      find: mockFind,
    });

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockFind).toHaveBeenCalledWith({ _id: { $lt: pivotId } });
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Feed retrieved',
      data: {
        count: 2,
        posts: [
          { ...mockOlderPosts[0], _id: mockId1.toString(), postId: mockId1.toString() },
          { ...mockOlderPosts[1], _id: mockId2.toString(), postId: mockId2.toString() },
        ],
      },
    });
  });

  it('should return posts after pivot post', async () => {
    const pivotId = new ObjectId();
    mockRequest.query = { after: pivotId.toHexString() };

    const mockId1 = new ObjectId();
    const mockId2 = new ObjectId();
    const mockNewerPosts = [
      { _id: mockId1, ctime: Date.now() + 1000, imgData: 'data1' },
      { _id: mockId2, ctime: Date.now() + 2000, imgData: 'data2' },
    ];

    const mockToArray = jest.fn<any>().mockResolvedValue(mockNewerPosts);
    const mockLimit = jest.fn<any>().mockReturnValue({ toArray: mockToArray });
    const mockSort = jest.fn<any>().mockReturnValue({ limit: mockLimit });
    const mockFind = jest.fn<any>().mockReturnValue({ sort: mockSort });

    mockDb.collection.mockReturnValue({
      find: mockFind,
    });

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockFind).toHaveBeenCalledWith({ _id: { $gt: pivotId } });
    expect(mockJson).toHaveBeenCalledWith({
      status: 'success',
      message: 'Feed retrieved',
      data: {
        count: 2,
        posts: [
          { ...mockNewerPosts[0], _id: mockId1.toString(), postId: mockId1.toString() },
          { ...mockNewerPosts[1], _id: mockId2.toString(), postId: mockId2.toString() },
        ],
      },
    });
  });

  it('should return 500 on database error', async () => {
    mockRequest.query = {};

    mockDb.collection.mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    await getFeed(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Internal server error',
    });
  });
});
