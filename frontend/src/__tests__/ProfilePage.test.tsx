import { render, screen, waitFor } from "@testing-library/react";
import { ProfilePage } from "../pages/ProfilePage";

const userResponse = {
  data: {
    user: {
      id: "user1",
      username: "ProfileUser",
      followers: 0,
      following: 0,
      reactions: 12,
      posts: [{ _id: "post1" }],
    },
  },
};

const postResponse = {
  data: {
    post: {
      imgData: "data:image/png;base64,postimg",
    },
  },
};

describe("ProfilePage", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn((url: RequestInfo) => {
      const href = typeof url === "string" ? url : url.toString();
      if (href.includes("/user/get/")) {
        return Promise.resolve({
          ok: true,
          json: async () => userResponse,
        } as Response);
      }
      if (href.includes("/post/get/")) {
        return Promise.resolve({
          ok: true,
          json: async () => postResponse,
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

  it("displays profile information once loaded", async () => {
    render(
      <ProfilePage
        authToken="token"
        profile={{ id: "user1" }}
        onBack={jest.fn()}
        isOwnProfile={false}
        reloadKey={0}
      />
    );

    await waitFor(() =>
      expect(screen.getAllByText("ProfileUser").length).toBeGreaterThan(0)
    );
    expect(screen.getByText(/posts/)).toBeInTheDocument();
  });
});

