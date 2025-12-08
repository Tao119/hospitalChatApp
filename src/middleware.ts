export { default } from 'next-auth/middleware'

export const config = {
    matcher: ['/chat/:path*', '/api/channels/:path*', '/api/threads/:path*', '/api/messages/:path*']
}
