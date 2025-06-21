# JS Backend Project

A Node.js backend project featuring user authentication, video uploads, playlists, comments, likes, subscriptions, and more. Built with Express, MongoDB, and Cloudinary.

## Features

- User registration and login (JWT authentication)
- Password hashing and secure token storage
- Video upload and management (Cloudinary integration)
- User profile with avatar and cover image uploads
- Playlists, comments, likes, and subscriptions
- Watch history tracking
- RESTful API structure
- Environment variable support via `.env`
- Modular codebase with MVC structure

## Tech Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- Cloudinary (media storage)
- Multer (file uploads)
- JWT (authentication)
- bcrypt (password hashing)
- dotenv (environment variables)
- Prettier (code formatting)

## Project Structure

```
.env
.env.sample
.gitignore
.prettierignore
.prettierrc
package.json
Readme.md
public/
  temp/
    .gitkeep
src/
  app.js
  constants.js
  index.js
  controllers/
    user.controller.js
  db/
    index.js
  middlewares/
    auth.middleware.js
    multer.middleware.js
  models/
    comment.model.js
    like.model.js
    playlist.model.js
    subscription.model.js
    tweet.model.js
    user.model.js
    video.model.js
  routes/
    user.routes.js
  utils/
    ApiError.js
    ApiResponse.js
    asyncHandler.js
    cloudinary.js
```

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- MongoDB database
- Cloudinary account

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Abdus-Samee-007/Backend-Project
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Copy `.env.sample` to `.env` and fill in your credentials:
   ```sh
   cp .env.sample .env
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

## API Endpoints

All endpoints are prefixed with `/api/v1/users`. Example endpoints:

- `POST /register` — Register a new user
- `POST /login` — Login user
- `POST /logout` — Logout user
- `POST /refresh-token` — Refresh JWT tokens
- `POST /change-password` — Change user password
- `GET /current-user` — Get current user profile
- `PATCH /update-account` — Update user details
- `PATCH /avatar` — Update user avatar
- `PATCH /cover-image` — Update user cover image
- `GET /c/:username` — Get user channel profile
- `GET /history` — Get watch history

## Environment Variables

See [.env.sample](.env.sample) for all required environment variables.

Example:
```
PORT=8000
MONGODB_URI= <insert your MONGODB_URI here>
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET= <insert your ACCESS_TOKEN_SECRET here>
ACCESS_TOKEN_EXPIRY= <insert your ACCESS_TOKEN_EXPIRY duration here>
REFRESH_TOKEN_SECRET= <insert your REFRESH_TOKEN_SECRET here>
REFRESH_TOKEN_EXPIRY= <insert your REFRESH_TOKEN_EXPIRY duration here>
CLOUDINARY_CLOUD_NAME= <insert your CLOUDINARY_CLOUD_NAME here>
CLOUDINARY_API_KEY= <insert your CLOUDINARY_API_KEY here>
CLOUDINARY_API_SECRET= <insert your CLOUDINARY_API_SECRET here>
```

## Scripts

- `npm run dev` — Start the development server with nodemon

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[ISC](LICENSE)

---