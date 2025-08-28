# PrayerWalk - AI-Powered Prayer and Spiritual Growth App

A Next.js application that combines AI technology with spiritual practices to enhance prayer life and spiritual growth. Built with Firebase, Google AI (Gemini), and modern web technologies.

## Features

- 🤖 **AI-Powered Prayer Assistance**: Intelligent prayer suggestions and spiritual guidance using Google's Gemini AI
- 🔥 **Firebase Integration**: Secure authentication, real-time database, and cloud storage
- 📱 **Progressive Web App**: Mobile-optimized experience with offline capabilities
- 🎵 **Audio Integration**: Prayer walk audio guidance and spiritual music
- 📊 **Activity Tracking**: Monitor prayer streaks and spiritual growth
- 📝 **Journal Integration**: Document and reflect on spiritual insights
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS and Radix UI

## Security Features

- ✅ Environment variables for sensitive credentials
- ✅ API keys properly secured and not exposed in repository
- ✅ Firebase security rules implementation
- ✅ Secure authentication flow

## Prerequisites

Before running this application, ensure you have:

- Node.js 18+ installed
- A Firebase project set up
- A Google AI API key (Gemini)
- Git installed

## Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adewoleeugene/Prayerwalk.git
   cd Prayerwalk
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your actual values in `.env.local`:
   
   **Firebase Configuration** (Get from Firebase Console > Project Settings > General):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```
   
   **Google AI Configuration** (Get from [Google AI Studio](https://makersuite.google.com/app/apikey)):
   ```env
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   ```

## Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication, Firestore, and Storage

2. **Configure Authentication**:
   - Enable Email/Password authentication
   - Configure authorized domains

3. **Set up Firestore**:
   - Create a Firestore database
   - Configure security rules as needed

## Google AI Setup

1. **Get API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add it to your `.env.local` file

## Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

2. **Start the AI development server** (optional):
   ```bash
   npm run genkit:dev
   ```

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## Project Structure

```
src/
├── ai/                 # AI flows and Genkit configuration
├── app/               # Next.js app router pages
├── components/        # Reusable React components
├── hooks/            # Custom React hooks
└── lib/              # Utility functions and configurations
```

## Key Technologies

- **Framework**: Next.js 15 with App Router
- **AI**: Google AI (Gemini) with Genkit
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Form Handling**: React Hook Form with Zod validation
- **TypeScript**: Full type safety

## Security Best Practices

- **Never commit `.env.local`** - Contains sensitive credentials
- **Use environment variables** for all API keys and secrets
- **Follow Firebase security rules** for database access
- **Validate all user inputs** using Zod schemas
- **Implement proper authentication** checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.

---

**⚠️ Important Security Note**: Never commit your `.env.local` file or expose your API keys. The `.env.example` file is provided as a template with placeholder values only.
