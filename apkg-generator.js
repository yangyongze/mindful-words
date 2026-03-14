const ApkgGenerator = {
  sandbox: null,
  sandboxReady: false,
  requestId: 0,
  pendingRequests: {},

  async init() {
    if (this.sandboxReady) return true;

    try {
      this.sandbox = document.createElement('iframe');
      this.sandbox.src = 'sandbox.html';
      this.sandbox.style.display = 'none';
      document.body.appendChild(this.sandbox);

      await new Promise((resolve, reject) => {
        this.sandbox.onload = resolve;
        this.sandbox.onerror = reject;
        setTimeout(() => reject(new Error('Sandbox load timeout')), 10000);
      });

      window.addEventListener('message', (event) => {
        const { type, requestId, success, data, error } = event.data;
        
        if (type === 'init-response') {
          this.sandboxReady = success;
          if (this.pendingRequests[requestId]) {
            this.pendingRequests[requestId](success);
            delete this.pendingRequests[requestId];
          }
        }
        
        if (type === 'generate-apkg-response') {
          if (this.pendingRequests[requestId]) {
            if (success) {
              this.pendingRequests[requestId]({ success: true, data });
            } else {
              this.pendingRequests[requestId]({ success: false, error });
            }
            delete this.pendingRequests[requestId];
          }
        }
      });

      const initRequestId = ++this.requestId;
      const initPromise = new Promise((resolve) => {
        this.pendingRequests[initRequestId] = resolve;
      });

      this.sandbox.contentWindow.postMessage({
        type: 'init',
        requestId: initRequestId
      }, '*');

      this.sandboxReady = await initPromise;
      return this.sandboxReady;
    } catch (error) {
      console.error('[ApkgGenerator] Initialization failed:', error);
      return false;
    }
  },

  async generateApkg(notes, deckName = 'Mindful Words') {
    if (!this.sandboxReady) {
      const success = await this.init();
      if (!success) {
        throw new Error('Failed to initialize APKG generator');
      }
    }

    const requestId = ++this.requestId;
    const responsePromise = new Promise((resolve) => {
      this.pendingRequests[requestId] = resolve;
    });

    this.sandbox.contentWindow.postMessage({
      type: 'generate-apkg',
      requestId,
      data: { notes, deckName }
    }, '*');

    const response = await responsePromise;
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate APKG');
    }

    return new Blob([response.data], { type: 'application/octet-stream' });
  },

  downloadApkg(blob, filename = 'mindful_words.apkg') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
};
