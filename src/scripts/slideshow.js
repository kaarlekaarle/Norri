/**
 * Image Slideshow with Random Order and Random Positioning
 */

class Slideshow {
    constructor(containerId, imagePaths, options = {}) {
        this.container = document.getElementById(containerId);
        this.imagePaths = imagePaths;
        this.options = {
            displayDuration: options.displayDuration || 3000, // 3 seconds default
            transitionDuration: options.transitionDuration || 250, // 0.25 second fade
            viewportPercentage: options.viewportPercentage || 20, // ~20% of viewport
            marginX: options.marginX || 5, // Horizontal margin percentage
            marginY: options.marginY || 5, // Vertical margin percentage
            ...options
        };
        
        this.currentIndex = 0;
        this.shuffledImages = [];
        this.currentImage = null;
        this.viewportWidth = window.innerWidth;
        this.viewportHeight = window.innerHeight;
        this.nextImageTimeout = null;
        this.isPaused = false;
        this.imageShowTime = null;
        this.fullDisplayDuration = null;
        
        // Update viewport dimensions in CSS
        this.updateViewportDimensions();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight;
            this.updateViewportDimensions();
        });
        
        // Handle tab visibility changes to prevent stuck images
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab became hidden - pause is handled by browser throttling
                // Don't pause here, let browser handle it
            } else {
                // Tab became visible - clean up any stuck images
                this.cleanupStuckImages();
                // Resume slideshow if it was paused (shouldn't be, but safety check)
                if (this.isPaused && this.currentImage) {
                    // Check if image still exists and is hovered
                    const isHovered = this.currentImage.matches(':hover');
                    if (!isHovered) {
                        this.resume();
                    }
                }
            }
        });
        
        this.init();
    }
    
    /**
     * Update CSS custom properties for viewport dimensions
     */
    updateViewportDimensions() {
        document.documentElement.style.setProperty('--viewport-width', `${this.viewportWidth}px`);
        document.documentElement.style.setProperty('--viewport-height', `${this.viewportHeight}px`);
    }
    
    /**
     * Pause the slideshow
     */
    pause() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        
        // Clear the timeout to stop the next image from showing
        if (this.nextImageTimeout) {
            clearTimeout(this.nextImageTimeout);
            this.nextImageTimeout = null;
        }
    }
    
    /**
     * Resume the slideshow
     */
    resume() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        
        // Calculate remaining time based on when image was shown
        let delay = this.options.transitionDuration + this.options.displayDuration;
        if (this.imageShowTime && this.fullDisplayDuration) {
            const elapsed = Date.now() - this.imageShowTime;
            const remaining = Math.max(0, this.fullDisplayDuration - elapsed);
            delay = remaining;
        }
        
        // Only resume if we have a current image
        if (this.currentImage) {
            this.nextImageTimeout = setTimeout(() => {
                this.nextImageTimeout = null;
                if (!this.isPaused) {
                    this.showNextImage();
                }
            }, delay);
        }
    }
    
    /**
     * Clean up any stuck images (multiple images visible at once)
     */
    cleanupStuckImages() {
        if (!this.container) return;
        
        // Get all slideshow images in the container
        const allImages = this.container.querySelectorAll('.slideshow-image');
        
        // Remove all images except the current one
        allImages.forEach(image => {
            if (image !== this.currentImage) {
                image.remove();
            }
        });
        
        // If current image exists but isn't active, make it active
        if (this.currentImage && !this.currentImage.classList.contains('active')) {
            this.currentImage.classList.add('active');
        }
        
        // If slideshow was paused due to hover on a removed image, resume it
        if (this.isPaused && this.currentImage) {
            const isHovered = this.currentImage.matches(':hover');
            if (!isHovered) {
                this.resume();
            }
        }
    }
    
    /**
     * Initialize the slideshow
     */
    init() {
        // Shuffle images for random order
        this.shuffledImages = [...this.imagePaths].sort(() => Math.random() - 0.5);
        
        // Preload all images
        this.preloadImages().then(() => {
            this.showNextImage();
        });
    }
    
    /**
     * Preload all images
     */
    preloadImages() {
        const promises = this.shuffledImages.map(src => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        });
        
        return Promise.all(promises);
    }
    
    /**
     * Show the next image in random position
     */
    showNextImage() {
        // Verify container exists
        if (!this.container) {
            console.error('Slideshow container not found');
            return;
        }
        
        // Get next image path
        const imagePath = this.shuffledImages[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.shuffledImages.length;
        
        // If we've gone through all images, reshuffle
        if (this.currentIndex === 0) {
            this.shuffledImages = [...this.imagePaths].sort(() => Math.random() - 0.5);
        }
        
        // Create image element
        const img = new Image();
        img.src = imagePath;
        img.className = 'slideshow-image';
        img.alt = 'Portfolio image';
        
        // Wait for image to load to get natural dimensions
        img.onload = () => {
            // Use full natural size of the image
            img.style.width = `${img.naturalWidth}px`;
            img.style.height = `${img.naturalHeight}px`;
            
            // Random centerpoint position within margins
            const centerpoint = this.getRandomCenterpoint(img.naturalWidth, img.naturalHeight);
            img.style.left = `${centerpoint.x}px`;
            img.style.top = `${centerpoint.y}px`;
            
            // Add to container
            this.container.appendChild(img);
            
            // --- FIX STARTS HERE ---
            
            // Capture the image that needs to be removed
            const previousImage = this.currentImage;
            
            // Start fade out of previous image
            if (previousImage) {
                previousImage.classList.remove('active');
                setTimeout(() => {
                    // Remove the CAPTURED previousImage, not this.currentImage
                    if (previousImage && previousImage.parentNode) {
                        previousImage.remove();
                    }
                }, this.options.transitionDuration);
            }
            
            // --- FIX ENDS HERE ---
            
            // Trigger fade in immediately
            requestAnimationFrame(() => {
                img.classList.add('active');
                // Ensure current image is on top for hover events
                img.style.zIndex = '10';
                // Lower z-index of previous image if it exists
                if (this.currentImage && this.currentImage !== img) {
                    this.currentImage.style.zIndex = '1';
                }
                // Now it is safe to update the global tracker
                this.currentImage = img;
            });
            
            // Add mouse event handlers for pause/resume on hover
            // Use capture phase to ensure events fire even if images overlap
            img.addEventListener('mouseenter', (e) => {
                e.stopPropagation();
                this.pause();
            }, true);
            
            img.addEventListener('mouseleave', (e) => {
                e.stopPropagation();
                this.resume();
            }, true);
            
            // Track when image is shown for resume calculation
            const displayDuration = this.options.transitionDuration + this.options.displayDuration;
            this.fullDisplayDuration = displayDuration;
            this.imageShowTime = Date.now();
            
            // Schedule next image after: fade in (0.25s) + static display (1.5s) = 1.75s
            // Schedule from when image is added to DOM, not from requestAnimationFrame
            // Clear any existing timeout to prevent multiple timers when tab becomes active
            if (this.nextImageTimeout) {
                clearTimeout(this.nextImageTimeout);
            }
            
            // Only schedule if not paused
            if (!this.isPaused) {
                this.nextImageTimeout = setTimeout(() => {
                    this.nextImageTimeout = null;
                    if (!this.isPaused) {
                        this.showNextImage();
                    }
                }, displayDuration);
            }
        };
        
        // Handle case where image fails to load (shouldn't happen with preloading, but safety)
        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}`);
            // Still schedule next image with same timing as successful load
            // Clear any existing timeout to prevent multiple timers
            if (this.nextImageTimeout) {
                clearTimeout(this.nextImageTimeout);
            }
            this.nextImageTimeout = setTimeout(() => {
                this.nextImageTimeout = null;
                this.showNextImage();
            }, this.options.transitionDuration + this.options.displayDuration);
        };
    }
    
    /**
     * Calculate image size as ~20% of viewport, maintaining aspect ratio
     */
    calculateImageSize(naturalWidth, naturalHeight) {
        const viewportSize = Math.min(this.viewportWidth, this.viewportHeight);
        const targetSize = (viewportSize * this.options.viewportPercentage) / 100;
        
        // Calculate scaling factor to maintain aspect ratio
        const aspectRatio = naturalWidth / naturalHeight;
        let width, height;
        
        if (naturalWidth > naturalHeight) {
            // Landscape or square
            width = targetSize;
            height = targetSize / aspectRatio;
        } else {
            // Portrait
            height = targetSize;
            width = targetSize * aspectRatio;
        }
        
        return { width, height };
    }
    
    /**
     * Get random centerpoint position within defined margins
     * Returns position where the centerpoint should be placed
     * Images can overflow viewport edges
     */
    getRandomCenterpoint(imageWidth, imageHeight) {
        const marginX = (this.viewportWidth * this.options.marginX) / 100;
        const marginY = (this.viewportHeight * this.options.marginY) / 100;
        
        // Calculate bounds for centerpoint (just margins, no image dimension accounting)
        const minX = marginX;
        const maxX = this.viewportWidth - marginX;
        const minY = marginY;
        const maxY = this.viewportHeight - marginY;
        
        // Random position within margin bounds
        const centerX = Math.random() * (maxX - minX) + minX;
        const centerY = Math.random() * (maxY - minY) + minY;
        
        return {
            x: centerX,
            y: centerY
        };
    }
}

// Initialize slideshow when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Get all images from the images directory
    // In a real scenario, you might want to fetch this list from a server
    // or define it manually
    const imagePaths = [
        'src/assets/images/036B1E1E-B8D5-4B74-A757-C87157474358_1_105_c.jpg',
        'src/assets/images/4457DBC1-5213-4591-B023-38C47B71AFEF_1_105_c.jpg',
        'src/assets/images/5064F329-4DF5-4506-991B-136EF12E4F23_1_105_c.jpg',
        'src/assets/images/5B84817E-7EA4-40AC-BC2A-8D355D2BC637_1_105_c.jpg',
        'src/assets/images/60F6AC33-BCD6-4327-8E3A-9B2A108B047C_1_105_c.jpg',
        'src/assets/images/6FD914C3-ED46-4998-ABF9-26508D03A6DE.jpg',
        'src/assets/images/6FEDA7DB-AE57-4820-995C-ED0D3AECDFBE_1_105_c.jpg',
        'src/assets/images/8159D7A4-4409-4F34-8B53-2D4F580F9508_1_105_c.jpg',
        'src/assets/images/8568CFC1-33E2-4EF9-972C-467F99F0A6D4_1_105_c.jpg',
        'src/assets/images/9687EF26-6B41-4677-AB15-3CF3C7230058_1_105_c.jpg',
        'src/assets/images/C3D5974E-C018-47FF-ACCA-9B44FB095A38_1_105_c.jpg',
        'src/assets/images/CE90C25C-D8DA-4F0E-BCD9-0C162E491511_1_105_c.jpg',
        'src/assets/images/D6AC5101-7467-4409-89C8-EC13929F6982_1_105_c.jpg',
        'src/assets/images/IMG_20170506_190600.jpg',
        'src/assets/images/IMG_20170524_125340.jpg',
        'src/assets/images/IMG_20170529_190311.jpg',
        'src/assets/images/IMG_20170602_093323.jpg',
        'src/assets/images/IMG_20170606_082900.jpg',
        'src/assets/images/IMG_20170606_093402.jpg',
        'src/assets/images/IMG_20170929_194102.jpg',
        'src/assets/images/IMG_20180414_115136.jpg',
        'src/assets/images/IMG_4A319B0EDCDE-3.jpg'
    ];
    
    // Initialize slideshow
    new Slideshow('slideshow', imagePaths, {
        displayDuration: 1500, // 1.5 seconds per image
        transitionDuration: 250, // 0.25 second fade in/out
        viewportPercentage: 20, // ~20% of viewport
        marginX: 20, // 20% horizontal margin for centerpoint (20% border from each side)
        marginY: 20 // 20% vertical margin for centerpoint (20% border from each side)
    });
});

