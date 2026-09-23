import { Context } from 'hono';
import { successResponse, errorResponse } from '../utils/response';
import { AuthService } from '../services/auth.service';

export class AuthController {

  async login(c: Context) {
    try {
      const { username, password } = await c.req.json();

      if (!username || !password) {
        return errorResponse(c, 'Username dan password wajib diisi.', 'VALIDATION_ERROR', undefined, 400);
      }

      const result = await AuthService.login(username, password);
      return successResponse(c, 'Login berhasil.', result);
    } catch (err: any) {
      console.error("AuthController.login error:", err);
      if (err.statusCode) {
        return errorResponse(c, err.message, err.code, undefined, err.statusCode);
      }
      return errorResponse(c, 'Gagal melakukan login.', 'LOGIN_ERROR', undefined, 500);
    }
  }

  async me(c: Context) {
    try {
      const admin = c.get('admin');
      if (!admin) {
        return errorResponse(c, 'Pengguna tidak terautentikasi.', 'UNAUTHORIZED', undefined, 401);
      }

      // Return the payload decoded from the token (which comes from Auth Service API)
      return successResponse(c, 'Data profil berhasil diambil dari token.', admin);
    } catch (err: any) {
      return errorResponse(c, 'Gagal mengambil data profil admin.', 'PROFILE_ERROR', undefined, 500);
    }
  }
}

export const authController = new AuthController();
