# WXT + React Chrome Extension

This extension is built using [WXT](https://wxt.dev/) and React. Follow the steps below to install dependencies, run the development environment, and load the extension in Chrome/Firefox for testing.

---

## 🛠️ Prerequisites & Installation

This project uses [Bun](https://bun.sh/) as its package manager.

1. **Install Bun** (if you haven't already):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
2. **Install dependencies**:
   ```bash
   bun install
   ```

---

## 💻 Running the Development Server

Start the WXT dev server, which will automatically watch for changes and reload the extension.

### For Chrome (Default)
```bash
bun run dev
```
This command builds the extension under `.output/chrome-mv3` and opens a new Google Chrome instance with the extension pre-loaded.

### For Firefox
```bash
bun run dev:firefox
```
This builds the extension under `.output/firefox-mv3` and opens Firefox.

---

## 🧪 Manual Installation & Testing in Chrome

If you want to load the extension into your own existing Chrome browser instance instead of the automated one:

1. Run the build or dev command:
   ```bash
   bun run build
   # or leave "bun run dev" running
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. In the top-right corner, toggle **Developer mode** to **ON**.
4. In the top-left corner, click **Load unpacked**.
5. Select the **`chrome-mv3`** directory located inside the **`.output`** folder:
   ```text
   <project_root>/.output/chrome-mv3
   ```
6. The extension is now active and ready for testing! Any subsequent builds or changes will auto-refresh, or you can manually click the circular reload icon in `chrome://extensions/`.

---

## 📦 Building for Production

To compile and bundle the extension for publication:

### Build only
```bash
bun run build
```
The output will be saved in `.output/chrome-mv3` (and `.output/firefox-mv3`).

### Build & Package (Zip)
```bash
bun run zip
```
This builds the production extension and packages it into a `.zip` archive inside the `.output/` folder, ready to be uploaded to the Chrome Web Store or Firefox Add-ons developer dashboard.
