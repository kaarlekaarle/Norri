/**
 * Virtual Viewport Scaling
 * Scales the virtual viewport container to fit within the browser window
 */

(function() {
    const VIRTUAL_WIDTH = 1024;
    const VIRTUAL_HEIGHT = 768;
    
    const virtualViewport = document.querySelector('.cv-virtual-viewport');
    
    if (!virtualViewport) {
        return;
    }
    
    /**
     * Calculate and apply scale factor
     */
    function updateScale() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate scale factors for both dimensions
        const scaleX = viewportWidth / VIRTUAL_WIDTH;
        const scaleY = viewportHeight / VIRTUAL_HEIGHT;
        
        // Use the smaller scale factor to ensure everything fits
        // This maintains aspect ratio and prevents overflow
        const scale = Math.min(scaleX, scaleY, 1);
        
        // Apply the scale transform
        virtualViewport.style.transform = `scale(${scale})`;
    }
    
    // Update scale on load and resize
    updateScale();
    window.addEventListener('resize', updateScale);
    
    // Also update when orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(updateScale, 100);
    });
})();

