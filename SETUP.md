# Setup Guide - Indoor Navigation System using AR

Complete guide to install, run, and test the Indoor Navigation System using AR.

## Prerequisites

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo Go** app on your phone - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779)

## Installation

### 1. Install Dependencies

```bash
cd "c:\Users\NITHIN\OneDrive\Desktop\Indoor Navigation System using AR"
npm install
```

> **Note**: This project now uses `expo-speech`, `three`, and `react-three-fiber`. If you encounter issues, try running a clean install:
> ```bash
> npx expo install expo-speech expo-sensors expo-gl expo-clipboard three @react-three/fiber @react-three/drei react-native-svg
> ```

### 2. Verify Installation

```bash
npx expo --version
```

## Running the App

### Start Development Server

```bash
npx expo start --clear
```

### Connect Your Phone

1. **Make sure your phone and computer are on the same Wi-Fi network**
2. **Open Expo Go** app on your phone
3. **Scan the QR code** shown in the terminal
4. App will load on your phone

## Testing on Device

### Android
- Open **Expo Go** app
- Tap **Scan QR Code**
- Point camera at QR code in terminal
- App loads automatically

### iOS
- Open **Camera** app
- Point at QR code
- Tap the notification to open in Expo Go

## Reloading the App

### On Phone
- **Shake** your device (or use the on-screen menu if enabled)
- Tap **Reload**

### From Terminal
- Press **r** to reload
- Press **m** to toggle menu

## Troubleshooting

### App Won't Load
1. Check Wi-Fi - phone and computer on same network
2. Restart Expo server: `Ctrl+C` then `npx expo start`
3. Clear Expo cache: `npx expo start -c`

### QR Code Not Scanning
1. Make sure you're using **Expo Go** app (not camera)
2. Try typing the URL manually in Expo Go
3. Check firewall settings

### "Unable to resolve module"
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### Port Already in Use
```bash
# Kill existing process
taskkill /F /IM node.exe

# Start again
npx expo start
```

## Tips for Best Experience

- **Compass Calibration**:
    - AR depends heavily on the compass. If the Blue Line points the wrong way, wave your phone in a **Figure-8 motion** for a few seconds to recalibrate.
    - Keep away from large metal objects or magnets (like laptop speakers).

- **Walking**:
    - Hold the phone steadily in front of you. The step counter is tuned for natural walking motion.
    - Walk around normal speed for best accuracy.

- **Building Switching**:
    - Use the toggle on the Home Screen to switch maps. Admin edits are saved separately for each building.

- **Voice Guidance**: Ensure your device volume is up to hear "Arriving" alerts.

- **Admin Editor**: Use the "Export JSON" button to save your changes to clipboard, then paste them into `app/assets/graph.json` to make them permanent.

---

**Ready to develop!**
