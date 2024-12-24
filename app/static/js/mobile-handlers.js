class MobileOptimization {
    constructor() {
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.initializeGestureHandlers();
        this.initializeMobileFeatures();
    }

    initializeGestureHandlers() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            this.touchEndY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', () => {
            this.handleSwipeGesture();
        });
    }

    handleSwipeGesture() {
        const swipeDistance = this.touchEndY - this.touchStartY;
        const threshold = 100;

        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance > 0) {
                this.handleSwipeDown();
            } else {
                this.handleSwipeUp();
            }
        }
    }

    handleSwipeDown() {
        // Refresh content or close modal
        const modal = document.querySelector('.modal.active');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    handleSwipeUp() {
        // Open options or show more content
        const options = document.querySelector('.mobile-options');
        if (options) {
            options.classList.add('active');
        }
    }

    initializeMobileFeatures() {
        this.setupPullToRefresh();
        this.setupInfiniteScroll();
        this.setupTouchFeedback();
        this.optimizeImages();
    }

    setupPullToRefresh() {
        const pullToRefresh = new PullToRefresh({
            mainElement: '.content-area',
            onRefresh: () => {
                // Refresh content
                return this.refreshContent();
            }
        });
    }

    async refreshContent() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Refresh data
            await this.fetchUpdatedData();
            
            // Update UI
            this.updateUI();
        } finally {
            this.hideLoadingState();
        }
    }

    setupInfiniteScroll() {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    this.loadMoreContent();
                }
            },
            { threshold: 0.1 }
        );

        const sentinel = document.querySelector('.load-more-sentinel');
        if (sentinel) {
            observer.observe(sentinel);
        }
    }

    setupTouchFeedback() {
        const buttons = document.querySelectorAll('button, .clickable');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.classList.add('active');
            }, { passive: true });

            button.addEventListener('touchend', () => {
                button.classList.remove('active');
            });
        });
    }

    optimizeImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        imageObserver.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: '50px' }
        );

        images.forEach(img => imageObserver.observe(img));
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        img.src = src;
        img.removeAttribute('data-src');
    }

    showLoadingState() {
        document.querySelectorAll('.content-skeleton').forEach(
            el => el.classList.add('skeleton-loading')
        );
    }

    hideLoadingState() {
        document.querySelectorAll('.content-skeleton').forEach(
            el => el.classList.remove('skeleton-loading')
        );
    }
} 