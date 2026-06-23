# ChatterBox

ChatterBox is a feature-rich chat application built using Next.js, MongoDB Atlas, and WebRTC. It supports real-time messaging, audio/video calls, and Google OAuth authentication.

## Features

- **Real-time Messaging**: Send and receive messages instantly.
- **Audio/Video Calls**: Connect with friends and colleagues using WebRTC.
- **Google OAuth**: Secure login and signup using Google.
- **Password Reset**: EmailJS-powered password reset links backed by MongoDB tokens.
- **Swipe Gestures**: Archive or delete chats with intuitive swipe actions.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Prerequisites

- Node.js 18+
- npm or pnpm
- MongoDB Atlas connection string

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: Database name (optional)
- `JWT_SECRET`: Secret used to sign app JWTs
- `NEXTAUTH_URL`: Base URL for NextAuth/custom auth redirects, such as `http://localhost:3000`
- `NEXTAUTH_SECRET`: Secret for NextAuth sessions
- `NEXT_PUBLIC_APP_URL`: Public app URL, such as `http://localhost:3000`
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: Google callback URL, such as `http://localhost:3000/api/auth/google/callback`
- `EMAILJS_SERVICE_ID`: EmailJS service ID
- `EMAILJS_PUBLIC_KEY`: EmailJS public key
- `EMAILJS_PRIVATE_KEY`: EmailJS private key, required for server-side sends from Render
- `EMAILJS_RESET_TEMPLATE_ID`: EmailJS reset template ID, currently `template_ovxq7jl`
- `GEMINI_API_KEY` or `GOOGLE_API_KEY`: Optional AI integration key

For Render deployment, set:

```env
NEXT_PUBLIC_APP_URL=https://chatterbox-qd15.onrender.com
GOOGLE_REDIRECT_URI=https://chatterbox-qd15.onrender.com/api/auth/google/callback
EMAILJS_RESET_TEMPLATE_ID=template_ovxq7jl
```

In EmailJS, enable server-side sending:

`Dashboard -> Account -> Security -> API calls from non-browser applications`

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Surya-1301/ChatterBOX.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

## Build and Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm start
   ```

Render is configured with `render.yaml`. Pushes to the connected `master` branch can trigger an automatic deploy.

## API Endpoints

- `POST /api/auth/signup`: Create a new account
- `POST /api/auth/login`: Login and receive a JWT
- `GET /api/auth/google`: Start Google OAuth
- `GET /api/auth/google/callback`: Complete Google OAuth
- `POST /api/auth/password-reset-request`: Create a password reset token and send the EmailJS reset email
- `POST /api/auth/password-reset-confirm`: Confirm a reset token and set a new password
- `GET /api/users`: Fetch user list
- `GET /api/messages?conversationId=...`: Fetch messages for a conversation
- `POST /api/messages`: Send a new message

## Known Issues

- **AI Integrations**: Requires `GEMINI_API_KEY` or `GOOGLE_API_KEY` for AI features.
- **Polling**: Real-time updates use polling; consider WebSockets for better performance.

## Contributing

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature description"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Create a pull request.

## License

This project is licensed under the MIT License.
