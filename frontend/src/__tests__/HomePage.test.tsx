import { render, screen, waitFor } from "@testing-library/react";
import { HomePage } from "../pages/HomePage";

const mockPost = {
  _id: "post1",
  user: "user1",
  imgData: "data:image/png;base64,xyz",
  ctime: Date.now(),
  reactions: {},
};

const mockUser = {
  username: "Alice",
  followers: 0,
  following: 0,
  posts: [],
};

describe("HomePage", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn((url: RequestInfo) => {
      const href = typeof url === "string" ? url : url.toString();
      if (href.includes("/post/get-feed")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { posts: [mockPost] } }),
        } as Response);
      }
      if (href.includes("/user/get/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { user: mockUser } }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("renders posts returned from the feed endpoint", async () => {
    render(
      <HomePage
        authToken="token"
        currentUserId="me"
        reloadKey={0}
        scrolledTop={false}
        scrolledBottom={false}
      />
    );

    expect(screen.getByText(/loading feed/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/Alice/)).toBeInTheDocument()
    );
  });
});

