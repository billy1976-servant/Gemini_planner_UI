/**
 * Product Repository - Storage and caching for normalized products
 * 
 * Storage:
 * - Local JSON file for dev
 * - Simple KV store (later)
 * 
 * Caching:
 * - Page fetch cache (disk cache) to avoid re-scraping
 * - Image cache plan (store URL now, optional download later)
 */

import type { Product, ProductGraph, CategoryExtraction } from "./product-types";
import * as fs from "fs";
import * as path from "path";

/**
 * Repository configuration
 */
export type RepositoryConfig = {
  dataDir: string; // Directory for storing product data
  cacheDir: string; // Directory for page fetch cache
  imageCacheDir?: string; // Optional directory for image cache
  enableImageDownload?: boolean; // Flag to enable image downloading
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RepositoryConfig = {
  dataDir: path.join(process.cwd(), "data", "products"),
  cacheDir: path.join(process.cwd(), "data", "cache"),
  imageCacheDir: path.join(process.cwd(), "data", "images"),
  enableImageDownload: false, // Disabled by default
};

/**
 * Product Repository
 */
export class ProductRepository {
  private config: RepositoryConfig;
  
  constructor(config?: Partial<RepositoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureDirectories();
  }
  
  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    [this.config.dataDir, this.config.cacheDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    if (this.config.imageCacheDir && !fs.existsSync(this.config.imageCacheDir)) {
      fs.mkdirSync(this.config.imageCacheDir, { recursive: true });
    }
  }
  
  /**
   * Save product graph to JSON file
   */
  async saveProductGraph(graph: ProductGraph): Promise<void> {
    const filePath = path.join(this.config.dataDir, "product-graph.json");
    fs.writeFileSync(filePath, JSON.stringify(graph, null, 2), "utf-8");
  }
  
  /**
   * Load product graph from JSON file
   */
  async loadProductGraph(): Promise<ProductGraph | null> {
    const filePath = path.join(this.config.dataDir, "product-graph.json");
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as ProductGraph;
    } catch (error) {
      console.error("[ProductRepository] Failed to load product graph:", error);
      return null;
    }
  }
  
  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    const graph = await this.loadProductGraph();
    if (!graph) {
      return null;
    }
    
    return graph.products.find((p) => p.id === productId) || null;
  }
  
  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    const graph = await this.loadProductGraph();
    if (!graph) {
      return [];
    }
    
    return graph.products.filter((p) => p.category === category);
  }
  
  /**
   * Get products by brand
   */
  async getProductsByBrand(brand: string): Promise<Product[]> {
    const graph = await this.loadProductGraph();
    if (!graph) {
      return [];
    }
    
    return graph.products.filter((p) => p.brand === brand);
  }
  
  /**
   * Search products by query (simple text search)
   */
  async searchProducts(query: string): Promise<Product[]> {
    const graph = await this.loadProductGraph();
    if (!graph) {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    return graph.products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Add or update product in graph
   */
  async upsertProduct(product: Product): Promise<void> {
    const graph = await this.loadProductGraph() || {
      products: [],
      categories: [],
      brands: [],
      extractedAt: new Date().toISOString(),
      sourceUrls: [],
    };
    
    // Remove existing product if present
    graph.products = graph.products.filter((p) => p.id !== product.id);
    
    // Add new product
    graph.products.push(product);
    
    // Update categories and brands
    if (!graph.categories.includes(product.category)) {
      graph.categories.push(product.category);
    }
    if (!graph.brands.includes(product.brand)) {
      graph.brands.push(product.brand);
    }
    if (!graph.sourceUrls.includes(product.url)) {
      graph.sourceUrls.push(product.url);
    }
    
    // Update extractedAt
    graph.extractedAt = new Date().toISOString();
    
    await this.saveProductGraph(graph);
  }
  
  /**
   * Get cache file path for a URL
   */
  private getCacheFilePath(url: string): string {
    // Create safe filename from URL
    const urlHash = this.hashUrl(url);
    return path.join(this.config.cacheDir, `${urlHash}.html`);
  }
  
  /**
   * Hash URL for cache filename
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Check if URL is cached
   */
  isCached(url: string): boolean {
    const cachePath = this.getCacheFilePath(url);
    return fs.existsSync(cachePath);
  }
  
  /**
   * Get cached HTML for URL
   */
  getCachedHtml(url: string): string | null {
    const cachePath = this.getCacheFilePath(url);
    
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    
    try {
      return fs.readFileSync(cachePath, "utf-8");
    } catch (error) {
      console.error(`[ProductRepository] Failed to read cache for ${url}:`, error);
      return null;
    }
  }
  
  /**
   * Cache HTML for URL
   */
  async cacheHtml(url: string, html: string): Promise<void> {
    const cachePath = this.getCacheFilePath(url);
    
    try {
      fs.writeFileSync(cachePath, html, "utf-8");
    } catch (error) {
      console.error(`[ProductRepository] Failed to cache HTML for ${url}:`, error);
    }
  }
  
  /**
   * Get image cache path for URL
   */
  getImageCachePath(imageUrl: string): string | null {
    if (!this.config.imageCacheDir || !this.config.enableImageDownload) {
      return null;
    }
    
    // Extract extension from URL
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath) || ".jpg";
    
    // Create safe filename
    const urlHash = this.hashUrl(imageUrl);
    return path.join(this.config.imageCacheDir, `${urlHash}${ext}`);
  }
  
  /**
   * Check if image is cached
   */
  isImageCached(imageUrl: string): boolean {
    const cachePath = this.getImageCachePath(imageUrl);
    if (!cachePath) {
      return false;
    }
    
    return fs.existsSync(cachePath);
  }
  
  /**
   * Get cached image path
   */
  getCachedImagePath(imageUrl: string): string | null {
    const cachePath = this.getImageCachePath(imageUrl);
    if (!cachePath || !fs.existsSync(cachePath)) {
      return null;
    }
    
    return cachePath;
  }
  
  /**
   * Save category extraction
   */
  async saveCategoryExtraction(extraction: CategoryExtraction): Promise<void> {
    const urlHash = this.hashUrl(extraction.categoryUrl);
    const filePath = path.join(this.config.dataDir, `category_${urlHash}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(extraction, null, 2), "utf-8");
  }
  
  /**
   * Load category extraction
   */
  async loadCategoryExtraction(categoryUrl: string): Promise<CategoryExtraction | null> {
    const urlHash = this.hashUrl(categoryUrl);
    const filePath = path.join(this.config.dataDir, `category_${urlHash}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as CategoryExtraction;
    } catch (error) {
      console.error(`[ProductRepository] Failed to load category extraction for ${categoryUrl}:`, error);
      return null;
    }
  }
}

/**
 * Create default repository instance
 */
export function createProductRepository(config?: Partial<RepositoryConfig>): ProductRepository {
  return new ProductRepository(config);
}
