self.onmessage = function(e) {
    const data = e.data;
    if (data === 'error') {
        throw new Error('Throw error for testing');
    }
    const result = `Echo: ${data}`;
    self.postMessage(result);
};