import { ipcMain, BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';

// ── Export PDF via webContents.printToPDF() ──
ipcMain.handle('export-pdf', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { success: false, error: 'No window focused' };

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export PDF',
    defaultPath: 'export.pdf',
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) return { success: false };

  try {
    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      printBackground: true,
      landscape: false,
    });
    fs.writeFileSync(filePath, pdfBuffer);
    return { success: true, path: filePath };
  } catch (err) {
    console.error('[PDF Export] Error:', err);
    return { success: false, error: String(err) };
  }
});
