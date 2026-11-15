# LoneStar WorkLog

Offline-first Texas Workforce Commission (TWC) work-search tracker, interview scheduler, and PDF log generator built with React, Vite, TanStack Router, and Capacitor.

## Data and privacy

- Work-search, saved-job, interview, reminder, and filing records are stored locally in the app's browser storage.
- The app does not require a cloud account to use its core logging features.
- Exported backups use PBKDF2-SHA-256 key derivation and AES-256-GCM encryption. The password is not stored in the app.
- On supported Android devices, an encrypted backup can be shared through the system share sheet to a storage provider chosen by the user. Otherwise, it downloads as a file for manual upload.
- Older unencrypted JSON backups remain importable for compatibility.
- The locked npm dependency tree is audited in CI; the current audit has no reported vulnerabilities.
- Local application data itself is currently not encrypted at rest. Use the Android device lock and keep the app/device protected. Encrypted backups do not change the at-rest storage format.

## Offline behavior and integrations

- Core record creation, editing, filtering, analytics, calendar-file export, and PDF export work from local data.
- Interview calendars export as standard .ics files for import into a calendar provider. A live subscription feed is not enabled in this offline-first build.
- Reminders are in-app prompts shown when the app is opened; Android background notification scheduling is not configured.
- Screenshot text import accepts text copied from Google Lens or another OCR app. Automatic on-device image OCR is not bundled.
- Job listings are retrieved from Remotive, Jobicy, and Remote OK when a network connection is available. Search filters exclude results whose selected salary, type, level, location, or posting date cannot be verified. Exact mileage-radius filtering is not available from these feeds.

## Development

Requirements: Node.js 22 and Java 21 for Android builds.

Run npm ci, npm run lint, npm test, npm run build, npx cap sync android, then ./gradlew assembleDebug from the android directory.

GitHub Actions runs lint, web build, and Android debug APK compilation on pull requests and pushes to main. Debug APKs are uploaded as workflow artifacts; they are not production-signed releases.

## TWC record reminder

This app is a record-keeping aid, not an official TWC system. Confirm current work-search requirements, qualifying activities, weekly minimums, and retention rules with the Texas Workforce Commission and your own claim instructions.