import { render, screen, fireEvent } from "@testing-library/react";
import { LoginPage } from "../pages/LoginPage";

describe("LoginPage", () => {
  const defaultProps = {
    onSwitchToRegister: jest.fn(),
    onLoginSuccess: jest.fn(),
  };

  it("renders the brand headline and sign in button", () => {
    render(<LoginPage {...defaultProps} />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows the password reset form when 'Forgot password?' is clicked", () => {
    render(<LoginPage {...defaultProps} />);

    const forgotButton = screen.getByRole("button", {
      name: /forgot password\?/i,
    });
    fireEvent.click(forgotButton);

    expect(
      screen.getByRole("button", { name: /send reset code/i })
    ).toBeInTheDocument();
  });
});

