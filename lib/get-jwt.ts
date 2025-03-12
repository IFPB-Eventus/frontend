export const getAuthToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1] || null;
};

  // Server-side function to get token from request headers
export function getTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
  
    return authHeader.split(" ")[1]
}