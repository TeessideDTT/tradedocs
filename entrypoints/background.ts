export default defineBackground(() => {
  // Allows the side panel to open when the extension action icon is clicked
  // Note: requires "sidePanel" permission in manifest
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  console.log('TradeDocs background script initialized.', { id: browser.runtime.id });
});
