# 🩺 Jitsi Consultation App

Une application de consultation médicale en ligne utilisant Jitsi Meet pour la vidéoconférence, développée avec React et Vite.

## ✨ Fonctionnalités

- **Consultation vidéo en temps réel** avec Jitsi Meet
- **Interface utilisateur moderne** avec une salle d'attente
- **Gestion des rôles** (Patient/Médecin)
- **Contrôles vidéo/audio** intégrés
- **Interface responsive** et intuitive
- **Gestion des participants** en temps réel

## 🚀 Technologies utilisées

- **React 19.1.1** - Interface utilisateur
- **Vite 7.1.7** - Build tool et dev server
- **Jitsi React SDK 1.4.4** - Intégration vidéoconférence
- **Lucide React** - Icônes modernes
- **ESLint** - Linting du code

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Navigateur web moderne avec support WebRTC

## 🛠️ Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/ichane31/Jitsi-aws-vite.git
   cd Test-jisti-docker
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer l'application en mode développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir votre navigateur** sur `http://localhost:5173`

## 📦 Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm run preview` - Prévisualise l'application de production
- `npm run lint` - Lance ESLint pour vérifier le code

## 🏗️ Structure du projet

```
src/
├── components/
│   ├── Navbar.jsx          # Barre de navigation
│   └── navbar.css          # Styles de la navbar
├── assets/
│   └── images/
│       ├── doctor.png      # Avatar du médecin
│       └── patient.png     # Avatar du patient
├── App.jsx                 # Composant principal
├── ConsultationApp.jsx     # Logique de consultation
├── consultationRoom.css    # Styles de la salle de consultation
├── App.css                 # Styles globaux
├── index.css              # Styles de base
└── main.jsx               # Point d'entrée React
```

## 🎮 Utilisation

### Démarrage d'une consultation

1. L'application démarre avec une interface de consultation
2. Les utilisateurs rejoignent automatiquement la salle de conférence
3. Une salle d'attente s'affiche si l'utilisateur est seul
4. Les contrôles vidéo/audio sont disponibles dans l'interface

### Contrôles disponibles

- **🎥 Caméra** - Activer/Désactiver la vidéo
- **🎤 Microphone** - Activer/Désactiver l'audio
- **📞 Raccrocher** - Terminer la consultation
- **👁️ Changer de vue** - Permuter l'affichage vidéo

### Configuration des rôles

```jsx
// Exemple d'utilisation
<ConsultationApp 
  userType="patient"        // ou "doctor"
  roomId="consultation123"
  patient={{nom: "Jean Dupont"}}
  doctor={{nom: "Dr. Martin", specialite: "Cardiologue"}}
/>
```

## ⚙️ Configuration Jitsi

L'application utilise une configuration Jitsi personnalisée :

- **P2P désactivé** pour une meilleure stabilité
- **Page de pré-connexion désactivée**
- **Barre d'outils simplifiée** (micro, caméra, raccrocher)
- **Watermark Jitsi masqué**

## 🔧 Personnalisation

### Modifier l'apparence

Les styles sont organisés dans plusieurs fichiers CSS :
- `App.css` - Styles généraux
- `consultationRoom.css` - Styles de la salle de consultation
- `components/navbar.css` - Styles de la navigation

### Ajouter de nouvelles fonctionnalités

Le composant `ConsultationApp.jsx` contient la logique principale. Vous pouvez :
- Ajouter de nouveaux contrôles vidéo
- Modifier la gestion des participants
- Personnaliser l'interface utilisateur

## 🐛 Dépannage

### Problèmes de caméra/microphone
- Vérifiez les permissions du navigateur
- Assurez-vous d'utiliser HTTPS en production
- Testez avec différents navigateurs

### Problèmes de connexion
- Vérifiez votre connexion internet
- Les serveurs Jitsi peuvent avoir des limites régionales

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

- **ichane31** - [GitHub](https://github.com/ichane31)

## 🙏 Remerciements

- [Jitsi Meet](https://jitsi.org/) pour l'infrastructure de vidéoconférence
- [React](https://reactjs.org/) pour le framework frontend
- [Vite](https://vitejs.dev/) pour l'outil de build moderne
- [Lucide React](https://lucide.dev/) pour les icônes
