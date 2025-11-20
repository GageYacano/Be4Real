import { fireEvent, render, screen } from "@testing-library/react";
import { RegisterPage } from "../pages/RegisterPage";

describe("RegisterPage", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", token: "fake-token" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it("advances to the terms step after entering basic info", () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "passw0rd!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      screen.getByText(/i agree to allow be4real/i)
    ).toBeInTheDocument();
  });

});

