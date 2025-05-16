# Rave Tycoon - Board Game Assistant

A digital companion app for the Rave Tycoon board game, featuring multiplayer lobby system and game management tools.

## Features

- Multiplayer lobby system with Firebase backend
- Real-time player synchronization
- Action cards management
- Dice rolling system
- Mini missions and party goals tracking
- FCKUP cards system
- Points/coins tracking

## Tech Stack

- HTML5, CSS3, JavaScript
- Firebase (Authentication, Firestore)
- Real-time multiplayer capabilities

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rave-tycoon.git
cd rave-tycoon
```

2. Set up Firebase:
- Create a new project in [Firebase Console](https://console.firebase.google.com)
- Enable Anonymous Authentication
- Create a Firestore database
- Update the Firebase configuration in `public/index.html` with your project settings

3. Install Firebase CLI (optional, for deployment):
```bash
npm install -g firebase-tools
firebase login
firebase init
```

4. Run locally:
- Use a local server (e.g., Live Server in VS Code)
- Or use Firebase hosting: `firebase serve`

## Development

The project structure is organized as follows:

```
public/
  ├── index.html      # Main HTML file
  ├── styles.css      # Styles
  └── script.js       # Game logic and Firebase integration
firebase.json         # Firebase configuration
firestore.rules      # Firestore security rules
```

## Deployment

Deploy to Firebase Hosting:

```bash
firebase deploy
```

## License

MIT License - feel free to use and modify for your own projects.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 