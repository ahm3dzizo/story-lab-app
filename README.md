# Story Lab Native

A React Native mobile application for creating and sharing stories. This app provides a platform for users to read, create, and interact with stories from various authors.

## Project Status

We have successfully developed the core architecture and UI components of the Story Lab Native app. The following components are complete:

- Navigation structure using React Navigation
- Screen components (Home, Details, Profile)
- UI components (StoryCard)
- Mock API service for data simulation

For building the APK, please refer to the [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) file.

## Features

- Browse a collection of stories
- View detailed story information
- User profiles
- Like and share stories
- Clean, modern UI

## Screenshots

(Screenshots will be added here once the app is completed)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- React Native development environment set up for Android/iOS
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/StoryLabNative.git
cd StoryLabNative
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the Metro bundler:
```bash
npm start
# or
yarn start
```

4. Run on Android:
```bash
npm run android
# or
yarn android
```

5. Run on iOS (macOS only):
```bash
npm run ios
# or
yarn ios
```

## Project Structure

```
StoryLabNative/
├── android/               # Android native code
├── ios/                   # iOS native code
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable components
│   ├── constants/         # Constants and configuration
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and services
│   └── screens/           # App screens
├── App.tsx                # Main app component
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## Dependencies

- React Native
- React Navigation
- React Native Gesture Handler
- React Native Reanimated
- React Native Safe Area Context
- React Native Screens

## Development Roadmap

- [x] Initial setup
- [x] Navigation structure
- [x] Home screen with story list
- [x] Story details screen
- [x] User profile screen
- [ ] Story creation functionality
- [ ] Authentication system
- [ ] Real API integration
- [ ] Comments and interactions
- [ ] Push notifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Story Lab - React Native App

## Supabase Database Issue Fix

If you're encountering the following error when loading messages:

```
Error loading messages: {"code": "PGRST200", "details": "Searched for a foreign key relationship between 'messages' and 'user_id' in the schema 'public', but no matches were found.", "hint": "Perhaps you meant 'employees' instead of 'messages'.", "message": "Could not find a relationship between 'messages' and 'user_id' in the schema cache"}
```

This indicates a missing table or relationship in your Supabase database. To fix it:

### Option 1: Fix via Supabase Dashboard (Recommended)

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to your project
3. Go to the "SQL Editor" tab
4. Copy the contents of the `supabase/migrations/fix_messages_relationship.sql` file
5. Paste it into a new SQL query in the SQL Editor
6. Run the query

### Option 2: Fix Foreign Key Constraint Violations

If you encounter an error like:

```
ERROR: 23503: insert or update on table "messages" violates foreign key constraint "messages_user_id_fkey"
DETAIL: Key (user_id)=(some-uuid) is not present in table "profiles".
```

Follow these steps:

1. Go to the Supabase SQL Editor
2. Copy the contents of `supabase/fix-missing-profile.sql`
3. Run this script first to create missing profiles
4. Then run the full `fix_messages_relationship.sql` script

### Option 3: Fix with Supabase CLI

If you have the Supabase CLI installed, run:

```bash
supabase migration up
```

### Option 4: Diagnose the Issue

To check your database schema and diagnose issues:

1. Go to the Supabase SQL Editor
2. Copy the contents of `supabase/check-schema.sql`
3. Run the query to see detailed information about your tables and relationships

### Client-Side Fallback Solution

We've also updated the client code in `app/(app)/chat/index.tsx` to handle database relationship issues gracefully. This includes:

- Fallback query methods if the primary query fails
- Placeholder user data if user information can't be fetched
- Enhanced error handling

For more details, see `README-SUPABASE-FIX.md`.

## Original README Content Below
