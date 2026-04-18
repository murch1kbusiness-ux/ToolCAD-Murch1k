

// ═══════════════════════════════════════════════
// PDF EXPORT — via Electron printToPDF
// ═══════════════════════════════════════════════
async function exportPDF() {
  if (!window.electronAPI?.exportPDF) {
    alert('PDF export is only available in the Electron app');
    return;
  }
  try {
    const result = await window.electronAPI.exportPDF();
    if (result.success) {
      showStatus('PDF eksportovano: ' + result.path);
    } else {
      alert('Pomylka eksportu PDF: ' + (result.error || 'Skasovano'));
    }
  } catch (err) {
    alert('Pomylka eksportu PDF: ' + String(err));
  }
}
