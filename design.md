# Proxy Scanner App - Design Document

## Overview
A minimal and stylish Android proxy scanner application for testing HTTP, HTTPS, SOCKS4, and SOCKS5 proxies with real-time feedback and performance metrics.

## Design Principles
- **Minimal & Clean**: Flat design with generous whitespace and subtle shadows
- **One-Handed Usage**: All interactive elements within thumb reach (bottom 2/3 of screen)
- **Real-time Feedback**: Instant visual feedback for all user actions
- **Performance Focused**: Show speed and latency metrics prominently
- **iOS-like Polish**: Smooth animations, haptic feedback, and refined typography

## Color Palette
- **Primary**: `#0a7ea4` (Professional Blue) - Main actions and accents
- **Background**: `#ffffff` (Light) / `#151718` (Dark)
- **Surface**: `#f5f5f5` (Light) / `#1e2022` (Dark) - Cards and containers
- **Foreground**: `#11181C` (Light) / `#ECEDEE` (Dark) - Primary text
- **Muted**: `#687076` (Light) / `#9BA1A6` (Dark) - Secondary text
- **Success**: `#22C55E` - Working/Active proxies
- **Warning**: `#F59E0B` - Slow proxies
- **Error**: `#EF4444` - Failed proxies
- **Border**: `#E5E7EB` (Light) / `#334155` (Dark)

## Screen List

### 1. **Home Screen** (Main Scanning Interface)
**Purpose**: Primary interface for proxy scanning and management

**Content & Layout**:
- Header: "Proxy Scanner" title with settings icon (top-right)
- Input Section:
  - Text input field for proxy list (multiline, placeholder: "Enter proxies (one per line)")
  - Format hint: "http://ip:port or socks5://ip:port"
- Proxy Type Selector:
  - Horizontal pill buttons: "HTTP", "HTTPS", "SOCKS4", "SOCKS5", "All"
  - Single selection, default: "All"
- Scan Settings:
  - Timeout slider: 5s-30s (default: 10s)
  - Thread count: 1-10 (default: 5)
  - Test URL input (optional, default: "http://httpbin.org/ip")
- Action Button:
  - Large primary button: "Start Scan" (disabled when no proxies entered)
  - Loading state: Spinner + "Scanning... X/Y"
- Results Preview:
  - Live list of scanned proxies with status indicators
  - Scroll area showing: IP:Port | Status | Speed | Type

### 2. **Results Screen** (Detailed Results)
**Purpose**: Display comprehensive scan results with filtering and export options

**Content & Layout**:
- Header: "Results" with close button and export icon
- Filter/Sort Bar:
  - Tabs: "All", "Working", "Failed", "Slow"
  - Sort dropdown: "Speed", "Type", "Response Time"
- Results List:
  - Card-based list for each proxy:
    - Left: Status badge (✓ green, ✗ red, ⚠ yellow)
    - Center: IP:Port, Type (HTTP/HTTPS/SOCKS4/SOCKS5)
    - Right: Speed (ms), Response time
  - Pull-to-refresh
- Bottom Actions:
  - Copy all working proxies
  - Export as JSON/TXT
  - Clear results

### 3. **Settings Screen** (Configuration)
**Purpose**: App preferences and advanced options

**Content & Layout**:
- Header: "Settings"
- Sections:
  - **Scanning Defaults**:
    - Default timeout
    - Default thread count
    - Default test URL
  - **Appearance**:
    - Dark mode toggle
    - Font size selector
  - **Advanced**:
    - Custom DNS option
    - Retry failed proxies toggle
    - Verbose logging toggle
  - **About**:
    - App version
    - GitHub link
    - Privacy policy link

## Key User Flows

### Flow 1: Basic Proxy Scanning
1. User opens app → Home screen displayed
2. User pastes proxy list into text input
3. User selects proxy types (optional, default: All)
4. User adjusts timeout/threads (optional)
5. User taps "Start Scan" button
6. Real-time progress shown with live results
7. Scan completes → Results screen auto-opens
8. User can filter, sort, copy, or export results

### Flow 2: Export Results
1. From Results screen, user taps export icon
2. Format selection modal appears (JSON/TXT/CSV)
3. User selects format
4. File generated and shared via system share sheet
5. User can save or send to other apps

### Flow 3: Retry Failed Proxies
1. From Results screen, user filters to "Failed"
2. User selects failed proxies (multi-select)
3. User taps "Retry" button
4. Scan runs only on selected proxies
5. Results updated with new status

## Typography
- **Headlines**: 28px, Bold, Foreground
- **Subheadings**: 18px, Semibold, Foreground
- **Body**: 16px, Regular, Foreground
- **Small**: 14px, Regular, Muted
- **Captions**: 12px, Regular, Muted

## Spacing & Layout
- **Padding**: 16px (standard), 8px (compact), 24px (section)
- **Gap**: 12px (between elements), 16px (between sections)
- **Border Radius**: 12px (cards), 8px (buttons), 4px (inputs)
- **Shadows**: Subtle (0.5-2px blur, 10% opacity)

## Interactive Elements

### Buttons
- **Primary**: Blue background, white text, 12px border-radius, 16px padding
- **Secondary**: Surface background, foreground text, 12px border-radius
- **Tertiary**: Transparent, foreground text, no padding
- **States**: Normal, Pressed (0.97 scale), Disabled (50% opacity)

### Input Fields
- **Text Input**: Surface background, 1px border, 12px padding, 8px border-radius
- **Focus State**: Blue border (2px), shadow
- **Error State**: Red border, error text below

### Status Badges
- **Working**: Green circle + checkmark
- **Failed**: Red circle + X
- **Slow**: Yellow circle + warning icon
- **Pending**: Gray circle + spinner

## Animations
- **Press Feedback**: 0.97 scale, 80ms duration
- **List Item Entry**: Fade in, 200ms duration
- **Progress Bar**: Smooth width transition, 300ms duration
- **Modal Slide**: Bottom-up slide, 250ms duration

## Accessibility
- Minimum touch target: 44x44pt
- Color contrast: WCAG AA (4.5:1 for text)
- VoiceOver support: All interactive elements labeled
- Haptic feedback: Light impact on button press

## Platform-Specific Notes
- **Android**: Material Design 3 compliance, edge-to-edge layout
- **iOS**: Human Interface Guidelines compliance, notch handling
- **Web**: Responsive design, 320px minimum width
