import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

/**
 * Створення головного меню програми
 * Додає пункт "Вигляд" з функціями скидання масштабу, перезавантаження та DevTools
 */
function createMenu() {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Вигляд',
      submenu: [
        {
          label: 'Скинути масштаб інтерфейсу',
          accelerator: 'CmdOrCtrl+Shift+0',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              win.webContents.setZoomFactor(1.0);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Перезавантажити застосунок',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload'
        },
        { type: 'separator' },
        {
          label: 'Відкрити інструменти розробника',
          accelerator: 'F12',
          click: () => {
            const win = BrowserWindow.getFocusedWindow();
            if (win) {
              win.webContents.toggleDevTools();
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'ToolCAD',
    icon: path.join(__dirname, '../../icon/icon.ico'),
    backgroundColor: '#13293d',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Показати вікно тільки коли готово — без білого flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Заголовок
  mainWindow.setTitle('ToolCAD');

  // Оптимізація пам'яті — очистити кеш при мінімізації
  mainWindow.on('minimize', () => {
    if (global.gc) global.gc();
  });

  // Додаємо обробник для відкриття DevTools при потребі
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F12 для відкриття/закриття DevTools
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools();
    }
    // Ctrl+Shift+I як альтернатива для DevTools
    if (input.control && input.shift && input.key === 'I') {
      mainWindow?.webContents.toggleDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMenu(); // Створюємо меню перед створенням вікна
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ───── Save / Open File IPC handlers ─────

ipcMain.handle('save-file', async (_event, jsonContent: string) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Зберегти проект',
    defaultPath: 'project.tcad',
    filters: [
      { name: 'ToolCAD Project', extensions: ['tcad'] },
      { name: 'JSON', extensions: ['json'] },
    ],
  });

  if (canceled || !filePath) {
    return { success: false };
  }

  try {
    fs.writeFileSync(filePath, jsonContent, 'utf-8');
    return { success: true, path: filePath, name: path.basename(filePath) };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('open-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Відкрити проект',
    filters: [
      { name: 'ToolCAD Project', extensions: ['tcad'] },
      { name: 'JSON', extensions: ['json'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) {
    return { success: false };
  }

  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return {
      success: true,
      content,
      path: filePaths[0],
      name: path.basename(filePaths[0]),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('export-file', async (_event, content: string, ext: string) => {
  const filters = ext === 'svg'
    ? [{ name: 'SVG Image', extensions: ['svg'] }]
    : ext === 'tcad-template'
      ? [{ name: 'ToolCAD Template', extensions: ['tcad-template'] }]
      : [{ name: 'DXF Drawing', extensions: ['dxf'] }];

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    title: `Export ${ext.toUpperCase()}`,
    defaultPath: ext === 'tcad-template' ? 'template.tcad-template' : `export.${ext}`,
    filters,
  });

  if (canceled || !filePath) return { success: false };

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('export-png', async (_event, buffer: ArrayBuffer) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Export PNG',
    defaultPath: 'export.png',
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
  });

  if (canceled || !filePath) return { success: false };

  try {
    const nodeBuffer = Buffer.from(buffer);
    fs.writeFileSync(filePath, nodeBuffer);
    return { success: true, path: filePath };
  } catch (err) {
    console.error('[PNG Export] Error:', err);
    return { success: false, error: String(err) };
  }
});

// ── Open Template File ──
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


// -- Open Template File --
ipcMain.handle('open-template-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Відкрити шаблон',
    filters: [
      { name: 'ToolCAD Template', extensions: ['tcad-template'] },
      { name: 'JSON', extensions: ['json'] },
    ],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return { success: false };

  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return {
      success: true,
      content,
      path: filePaths[0],
      name: path.basename(filePaths[0]),
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

