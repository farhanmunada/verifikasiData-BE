export class AuthService {
    static async login(username: string, password: string) {
        try {
            const response = await fetch(`${process.env.API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw { statusCode: response.status, message: data.message, code: data.code };
            }

            const data = await response.json();
            return data;

        } catch (error: any) {
            console.error('Login fetch error:', error);
            if (error.statusCode) {
                throw error;
            }
            throw { statusCode: 500, message: 'Gagal melakukan login.', code: 'LOGIN_ERROR' };
        }
    }
}