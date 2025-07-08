# StorageMaser

An open source Chrome extension for managing and inspecting browser storage (localStorage and sessionStorage) in real time.

## Features

- View, search, and filter all localStorage and sessionStorage data for the current tab
- Edit, add, and delete storage items with instant feedback
- Real-time sync: changes in storage are reflected immediately in the popup and vice versa
- Alphabetical sorting and fast search for large storage sets
- Import/Export storage data in JSON format
- Clear storage with just one click

## Installation

### 1. Clone the repository

```sh
git clone https://github.com/yourusername/storagemaser.git
cd storagemaser
```

### 2. Install dependencies

```sh
npm install
```

### 3. Build the extension

To build both the popup and content scripts:

```sh
npm run build
```

Or, for development with live rebuilds:

```sh
npm run build:watch
```

The built extension will be in the `dist/` directory.

### 4. Load the extension in Chrome

1. Open `chrome://extensions/` in your browser.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `dist/` directory inside the project root.

The StorageMaser icon should now appear in your Chrome toolbar.
