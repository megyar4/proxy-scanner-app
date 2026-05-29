# Proxy Scanner - Setup & Installation Guide

## Overview

**Proxy Scanner** is a minimal and stylish Android application for testing HTTP, HTTPS, SOCKS4, and SOCKS5 proxies. The app provides real-time scanning with performance metrics, filtering, and export capabilities.

## Features

- **Multi-Protocol Support**: Test HTTP, HTTPS, SOCKS4, and SOCKS5 proxies
- **Real-Time Scanning**: Live progress updates during proxy testing
- **Performance Metrics**: View response times and latency for each proxy
- **Advanced Filtering**: Filter results by status (Working, Slow, Failed)
- **Sorting Options**: Sort by speed, type, or status
- **Export Functionality**: Export results as JSON, TXT, or CSV
- **Clipboard Integration**: Copy working proxies directly to clipboard
- **Dark Mode Support**: Full dark mode support for comfortable viewing
- **Minimal UI**: Clean, modern interface with intuitive controls

## System Requirements

- **Node.js**: 18.x or higher
- **pnpm**: 9.x or higher
- **Android SDK**: API level 24 or higher (for building APK)
- **Expo CLI**: Latest version

## Installation Steps

### 1. Clone or Download the Project

```bash
cd /home/ubuntu/proxy-scanner-app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development Server

```bash
pnpm dev
```

This will start both the Metro bundler and the API server. The app will be available at the URL shown in the terminal.

### 4. Run on Android (Using Expo Go)

**Option A: Using QR Code (Recommended)**

1. Install **Expo Go** from Google Play Store on your Android device
2. Run the following command to generate a QR code:
   ```bash
   pnpm qr
   ```
3. Scan the QR code with your device using Expo Go
4. The app will load automatically

**Option B: Using Android Emulator**

```bash
pnpm android
```

This requires Android Studio and an emulator to be running.

## Building for Production

### Generate APK for Android

```bash
eas build --platform android --local
```

Or use Expo's cloud build:

```bash
eas build --platform android
```

This will generate a production-ready APK that can be installed on any Android device.

## Project Structure

```
proxy-scanner-app/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Home screen with proxy input
│   │   └── results.tsx        # Results screen with filtering
│   ├── _layout.tsx            # Root layout with providers
│   └── oauth/
├── lib/
│   ├── proxy-scanner.ts       # Core proxy testing logic
│   ├── proxy-context.tsx      # State management
│   └── ...
├── components/
│   ├── screen-container.tsx   # SafeArea wrapper
│   └── ...
├── tests/
│   └── proxy-scanner.test.ts  # Unit tests
├── assets/
│   └── images/
│       ├── icon.png           # App icon
│       ├── splash-icon.png    # Splash screen
│       └── ...
├── app.config.ts              # Expo configuration
├── tailwind.config.js          # Tailwind CSS config
└── package.json
```

## Usage Guide

### Home Screen

1. **Enter Proxies**: Paste your proxy list in the input field (one per line)
   - Supported formats: `ip:port`, `http://ip:port`, `socks5://ip:port`
2. **Select Types**: Choose which proxy types to test (HTTP, HTTPS, SOCKS4, SOCKS5)
3. **Configure Settings**:
   - **Timeout**: Set connection timeout (5-30 seconds)
   - **Threads**: Number of concurrent connections (1-10)
   - **Test URL**: Custom URL for testing (default: httpbin.org)
4. **Start Scan**: Tap "Start Scan" to begin testing
5. **Monitor Progress**: Watch real-time results as proxies are tested

### Results Screen

1. **View Statistics**: See counts of working, slow, and failed proxies
2. **Filter Results**: Use tabs to filter by status
3. **Sort Results**: Sort by speed, type, or status
4. **Copy Proxies**: Copy all working proxies to clipboard
5. **Export Data**: Export results as JSON, TXT, or CSV
6. **Clear Results**: Clear all results to start fresh

## Configuration

### Customize Theme Colors

Edit `theme.config.js` to change the app's color scheme:

```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  // ... other colors
};
```

### Update App Branding

Edit `app.config.ts` to change app name and logo:

```typescript
const env = {
  appName: "Proxy Scanner",
  appSlug: "proxy-scanner-app",
  logoUrl: "https://your-logo-url.png",
};
```

## Testing

Run unit tests to verify proxy scanning logic:

```bash
pnpm test
```

Tests cover:
- Proxy parsing (various formats)
- IP validation
- Export functionality
- Data filtering and sorting

## Troubleshooting

### App won't start

1. Clear cache: `pnpm install && pnpm dev`
2. Check Node.js version: `node --version` (should be 18+)
3. Verify pnpm is installed: `pnpm --version`

### Proxies not scanning

1. Verify proxy format is correct (ip:port)
2. Check internet connection
3. Increase timeout if proxies are slow
4. Check if proxy server is online

### Build fails

1. Clear build cache: `rm -rf .expo`
2. Reinstall dependencies: `pnpm install`
3. Check Android SDK is properly configured
4. Verify Java is installed: `java -version`

## Performance Tips

- **Reduce Thread Count**: Lower thread count if experiencing connection issues
- **Increase Timeout**: Increase timeout for slow networks
- **Batch Proxies**: Test proxies in smaller batches for better performance
- **Use Wired Connection**: Wired connection is more stable than WiFi

## API Reference

### ProxyResult Interface

```typescript
interface ProxyResult {
  ip: string;
  port: number;
  type: ProxyType; // 'http' | 'https' | 'socks4' | 'socks5'
  status: ProxyStatus; // 'pending' | 'working' | 'slow' | 'failed'
  responseTime: number; // milliseconds
  error?: string;
  timestamp: number;
}
```

### Proxy Scanner Functions

```typescript
// Parse a single proxy string
parseProxy(proxyString: string): { ip: string; port: number; type?: ProxyType } | null

// Parse multiple proxies from text
parseProxyList(proxyText: string, defaultTypes: ProxyType[]): Array<{ ip: string; port: number; type: ProxyType }>

// Test a single proxy
testProxy(ip: string, port: number, type: ProxyType, testUrl: string, timeout: number): Promise<ProxyResult>

// Scan multiple proxies with concurrency
scanProxies(proxies: Array<{ ip: string; port: number; type: ProxyType }>, options: ScanOptions, onProgress?: callback): Promise<ProxyResult[]>

// Export functions
exportAsJSON(results: ProxyResult[]): string
exportAsTXT(results: ProxyResult[]): string
exportAsCSV(results: ProxyResult[]): string
```

## Contributing

To add new features or fix bugs:

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`

## License

This project is provided as-is for educational and testing purposes.

## Support

For issues or questions, please refer to the project documentation or contact support.

## Version History

- **v1.0.0** (2026-05-29): Initial release
  - Core proxy scanning functionality
  - Multi-protocol support (HTTP, HTTPS, SOCKS4, SOCKS5)
  - Results filtering and export
  - Dark mode support
  - Minimal, modern UI

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [NativeWind (Tailwind CSS for React Native)](https://www.nativewind.dev)
- [Proxy Testing Best Practices](https://en.wikipedia.org/wiki/Proxy_server)
