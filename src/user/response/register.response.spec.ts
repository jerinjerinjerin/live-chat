import {
  RegisterResponse,
  VerifyOtpResponse,
  LoginResponse,
} from './register.response';

describe('GraphQL Response DTOs', () => {
  it('RegisterResponse should have message, email, otpSent properties', () => {
    const obj = new RegisterResponse();
    expect(obj).toHaveProperty('message');
    expect(obj).toHaveProperty('email');
    expect(obj).toHaveProperty('otpSent');
  });

  it('VerifyOtpResponse should have message, accessToken, refreshToken properties', () => {
    const obj = new VerifyOtpResponse();
    expect(obj).toHaveProperty('message');
    expect(obj).toHaveProperty('accessToken');
    expect(obj).toHaveProperty('refreshToken');
  });

  it('LoginResponse should have message, accessToken, refreshToken properties', () => {
    const obj = new LoginResponse();
    expect(obj).toHaveProperty('message');
    expect(obj).toHaveProperty('accessToken');
    expect(obj).toHaveProperty('refreshToken');
  });
});
