# TDO Builder

TDO Builder is a browser extension for creating trade documentation directly in the browser with structured embedded data for interoperability and later re-import.

It is built with `WXT`, `React`, `TypeScript`, `Tailwind CSS`, and `shadcn/ui`, and is focused on generating UN/CEFACT-aligned trade documents such as commercial invoices and packing lists.

## What It Does

TDO Builder lets you:

- create trade documents from predefined layouts or from scratch
- edit and save reusable local templates
- export visually styled HTML documents as PDF
- embed structured trade data as:
  - UN/CEFACT CII XML
  - Schema.org JSON-LD
  - TradeDocs app metadata such as `layoutId`
- preserve layout identity across export and re-import
- import compliant PDFs back into the app and reconstruct the document
- verify document integrity using a SHA-256 verification hash and QR code when applicable

## Current Document Types

- Commercial Invoice
- Packing List

## Key Features

### Multi-layout HTML document rendering

The app currently supports multiple predefined HTML layouts for trade documents. These layouts are used for both on-screen editing and visual PDF generation.

Current layout components:

- Standard layout
- Modern layout
- Minimal layout

### Template management

Users can save document data locally as reusable templates and later:

- view a template
- edit a template
- delete a template
- create a live document from a saved template

Templates are stored locally using `wxt/storage`.

### PDF export modes

The sidepanel allows users to choose how structured data is embedded into exported PDFs:

- `metadata`: embed data in XMP metadata only
- `attachment`: embed data as PDF attachments only
- `both`: embed both XMP metadata and PDF attachments

### Embedded document data

Depending on export settings, generated PDFs may include:

- `metadata.jsonld`
- CII XML attachment:
  - `factur-x.xml` for invoices
  - `packing-list-cii.xml` for packing lists
- `tradedocs.json` for internal app metadata such as `layoutId` and document type
- XMP metadata containing embedded JSON-LD and related verification metadata

### Verification hash and QR code

For non-template documents, the app can generate a verification hash and QR code for tamper detection.

Behavior:

- templates do not get verification hashes or QR codes
- imported/generated documents with an existing hash keep it if the document is not edited
- documents without a hash get one generated on export
- edited live documents get a fresh hash and timestamp

The verification payload is also stored in metadata so imported files can be validated later.

## Product Structure

### Main application

The full app opens in a browser tab and includes:

- `Dashboard`: browse built-in document layouts
- `Generator`: create or import live trade documents
- `My Templates`: manage locally saved templates
- `Editor`: view or edit saved templates separately from live document generation

### Sidepanel

The sidepanel provides quick access to:

- Dashboard
- Create New
- My Templates
- PDF export mode selection

The extension action icon is configured to open the sidepanel directly.

## Core Workflow

### 1. Start a document

Users can:

- choose a default layout from the dashboard
- create a document from scratch
- load a saved template
- import an existing PDF/A-3 trade document

### 2. Edit structured data

Users can edit:

- seller and buyer details
- currency and country values
- line items
- HS codes
- taxes
- totals
- document identifiers and dates

### 3. Export

The rendered HTML document is captured and exported as PDF, then enriched with:

- structured JSON-LD
- UN/CEFACT CII XML
- application metadata
- optional verification hash and QR code

### 4. Re-import

The app can upload a compatible PDF, extract the embedded metadata, reconstruct the document, preserve the chosen layout when available, and warn if verification fails.

## Tech Stack

- `WXT`
- `React`
- `TypeScript`
- `React Router`
- `Tailwind CSS v4`
- `shadcn/ui`
- `pdf-lib`
- `jsPDF`
- `html-to-image`
- `unpdf`
- `qrcode`

## Important Files

- [wxt.config.ts](file:///Users/solmei/ChromeExtApps/tradedocs/wxt.config.ts): extension manifest and WXT configuration
- [App.tsx](file:///Users/solmei/ChromeExtApps/tradedocs/entrypoints/app/App.tsx): main app routes and navigation
- [Templates.tsx](file:///Users/solmei/ChromeExtApps/tradedocs/entrypoints/app/Templates.tsx): dashboard templates and PDF import
- [InvoiceGenerator.tsx](file:///Users/solmei/ChromeExtApps/tradedocs/entrypoints/app/InvoiceGenerator.tsx): live document generation flow
- [Editor.tsx](file:///Users/solmei/ChromeExtApps/tradedocs/entrypoints/app/Editor.tsx): template view/edit page
- [MyDocuments.tsx](file:///Users/solmei/ChromeExtApps/tradedocs/entrypoints/app/MyDocuments.tsx): saved template management
- [InvoiceForm.tsx](file:///Users/solmei/ChromeExtApps/tradedocs/entrypoints/app/InvoiceForm.tsx): shared form and layout switching
- [pdf.ts](file:///Users/solmei/ChromeExtApps/tradedocs/lib/uncefact/pdf.ts): PDF generation, metadata embedding, import, and verification

## Development

### Install dependencies

You can use your preferred package manager. The project currently exposes standard npm scripts.

```bash
npm install
```

### Start development

Chrome:

```bash
npm run dev
```

Firefox:

```bash
npm run dev:firefox
```

### Type-check

```bash
npm run compile
```

### Production build

```bash
npm run build
```

### Create distributable archive

```bash
npm run zip
```

## Load The Extension Manually

1. Run `npm run build` or keep `npm run dev` running.
2. Open `chrome://extensions/`.
3. Enable developer mode.
4. Click `Load unpacked`.
5. Select `.output/chrome-mv3`.

For Firefox builds, use the generated Firefox output folder instead.

## Notes

- This project focuses on structured trade data interoperability, not just visual PDF rendering.
- Layout identity is preserved across export/import where TradeDocs metadata is present.
- Import verification depends on embedded verification metadata being present in the source PDF.
- Templates are intentionally treated differently from live generated documents during verification.

## Roadmap Direction

The current architecture is already prepared for:

- additional trade document types
- more predefined layout designs
- stronger validation and verification workflows
- deeper metadata interoperability

## Plugin Identity

- Product name: `TDO Builder`
- Description: `Create UN/CEFACT compliant trade docs directly in your browser.`

## License

MIT
