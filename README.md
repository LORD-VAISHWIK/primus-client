# Primus Client

A modern React-based client application for the Primus gaming platform.

## Features

- 🎮 Gaming platform interface
- 🔐 User authentication and registration
- 📊 Dashboard with gaming statistics
- 🎯 Game management and booking
- 💳 Wallet and payment integration
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **State Management**: React Hooks
- **Build Tool**: Vite
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/LORD-VAISHWIK/primus-client.git
cd primus-client
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_API_URL=your_backend_api_url
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite configuration
3. Deploy with the default settings

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. The built files will be in the `dist` directory
3. Deploy the `dist` directory to your hosting provider

## Project Structure

```
src/
├── components/          # React components
├── utils/              # Utility functions
├── assets/             # Static assets
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
