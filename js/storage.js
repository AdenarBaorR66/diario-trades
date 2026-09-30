/* ============================================================
   STORAGE — lembra a última planilha e as preferências
   Tudo fica só neste navegador (localStorage). Nada sai do aparelho.
   ============================================================ */
window.DT = window.DT || {};

DT.storage = (function () {
  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* sem acesso ao armazenamento */ }
  }

  return {
    loadData: () => read(DT.config.storageKey),
    saveData: (data) => write(DT.config.storageKey, data),
    clearData: () => remove(DT.config.storageKey),
    loadPrefs: () => read(DT.config.prefsKey) || {},
    savePrefs: (prefs) => write(DT.config.prefsKey, prefs)
  };
})();
