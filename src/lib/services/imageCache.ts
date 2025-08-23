import { Image } from 'expo-image';
import { ProductItem } from '~/lib/types/product';

class ImageCacheService {
  private preloadedImages = new Set<string>();
  private preloadingQueue = new Map<string, Promise<void>>();
  private maxCacheSize = 100; // Maximum number of preloaded images to track
  private maxConcurrentLoads = 3; // Maximum concurrent image loads

  async preloadProductImages(products: ProductItem[]): Promise<void> {
    const imageUrls = products
      .map(product => product.imageURL)
      .filter((url): url is string => {
        // Filter out already preloaded or currently loading images
        return Boolean(url) && !this.preloadedImages.has(url) && !this.preloadingQueue.has(url);
      });

    if (imageUrls.length === 0) return;

    // Limit the number of images to preload at once
    const limitedUrls = imageUrls.slice(0, 10);

    try {
      // Process images in batches to prevent memory pressure
      await this.preloadInBatches(limitedUrls);
    } catch (error) {
      console.warn('Failed to preload some images:', error);
    }
  }

  private async preloadInBatches(urls: string[]): Promise<void> {
    const batches: string[][] = [];
    
    // Split URLs into batches
    for (let i = 0; i < urls.length; i += this.maxConcurrentLoads) {
      batches.push(urls.slice(i, i + this.maxConcurrentLoads));
    }

    // Process each batch sequentially
    for (const batch of batches) {
      const promises = batch.map(url => this.preloadSingleImage(url));
      await Promise.allSettled(promises);
      
      // Small delay between batches to prevent overwhelming the system
      if (batch !== batches[batches.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async preloadSingleImage(url: string): Promise<void> {
    // Create promise for this image if not already loading
    if (!this.preloadingQueue.has(url)) {
      const promise = this.loadImage(url);
      this.preloadingQueue.set(url, promise);
      
      try {
        await promise;
        this.preloadedImages.add(url);
        
        // Clean up cache if it gets too large
        this.cleanupCache();
      } catch (error) {
        console.warn(`Failed to preload image: ${url}`, error);
      } finally {
        this.preloadingQueue.delete(url);
      }
    } else {
      // Wait for existing load to complete
      await this.preloadingQueue.get(url);
    }
  }

  private async loadImage(url: string): Promise<void> {
    try {
      await Image.prefetch(url);
    } catch (error) {
      throw new Error(`Image prefetch failed: ${error.message}`);
    }
  }

  private cleanupCache(): void {
    if (this.preloadedImages.size > this.maxCacheSize) {
      // Remove oldest entries (first in Set)
      const imagesToRemove = Math.floor(this.maxCacheSize * 0.2); // Remove 20% of cache
      const iterator = this.preloadedImages.values();
      
      for (let i = 0; i < imagesToRemove; i++) {
        const { value } = iterator.next();
        if (value) {
          this.preloadedImages.delete(value);
        }
      }
    }
  }

  isImagePreloaded(url: string | undefined): boolean {
    return url ? this.preloadedImages.has(url) : false;
  }

  clearCache(): void {
    try {
      Image.clearMemoryCache();
      Image.clearDiskCache();
      this.preloadedImages.clear();
      this.preloadingQueue.clear();
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  }

  // Add method to get cache stats
  getCacheStats(): { preloaded: number; loading: number } {
    return {
      preloaded: this.preloadedImages.size,
      loading: this.preloadingQueue.size
    };
  }
}

export const imageCache = new ImageCacheService();